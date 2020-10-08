const hummus = require('hummus')
const { isString, isArray, clone, cloneDeep } = require('lodash')

const DocumentMeasurements = require('./document-measurements')
const ModifiedPageDriver = require('./modified-page-driver')
const NewPageDriver = require('./new-page-driver')
const DocumentText = require('./document-text')
const ExternalsMap = require('./externals-map')
const StreamObjectComposer = require('./stream-object-composer')
const EhnhancedBox = require('./enhanced-box')
const EnhancedOptions = require('./enhanced-options')

const kKnownProtectionValues = {
    allowPrint: 1 << 2,
    allowModification: 1 << 3,
    allowCopy: 1 << 4,
    allowAnnotations: 1 << 5,
    allowFilling: 1 << 8,
    allowAccessibility: 1 << 9,
    allowAssemble: 1 << 10,
    allowPrintHighRes: 1 << 11,
}

function createEngineOptions(document) {
    if (!document || !document.protection) return null

    let { userPassword, ownerPassword, userProtectionFlag } = document.protection

    if (userProtectionFlag) {
        if (isString(userProtectionFlag)) {
            userProtectionFlag = kKnownProtectionValues[userProtectionFlag]
        } else if (isArray(userProtectionFlag)) {
            userProtectionFlag = userProtectionFlag.reduce(
                (acc, flag) => acc | (kKnownProtectionValues[flag] || 0),
                0
            )
        }
    }

    return {
        userPassword,
        ownerPassword,
        userProtectionFlag,
    }
}


class PDFEngine {
    constructor(externalsMap) {
        this.externalsMap = new ExternalsMap(externalsMap)
        
        // helpers state during the process of rendering a document
        this.writer = null
        this.measurements = null
        this.copyingContexts = []
        this.documentText = null
    }

    _cleanup() {
        this.writer = null
        this.measurements = null
        this.copyingContexts = []    
        this.documentText = null    
    }    

    _appendPage(pageAppendData) {
        const originPath = this.externalsMap.getExternalPath(pageAppendData.source)
        if(!originPath) {
            throw new Error('No source path defined for appending pages')
        }

        const originType = this.writer.getImageType(originPath)
        const allPages = (typeof pageAppendData.index === 'undefined' || pageAppendData.index == 'all')
        const startIndex = allPages ?  0:pageAppendData.index
        let endIndex
        
        /*
            Allow appending pages of PDF files or of TIFF images
        */
        if(originType === 'PDF') {
            const copyContext = this._getCopyingContext(originPath,pageAppendData.password ? {password:pageAppendData.password} : null)
            if(!copyContext) {
                throw new Error('Unable to create copying context for appended page')
            }
            endIndex = allPages ? 
                (copyContext.getSourceDocumentParser().getPagesCount() - 1) : 
                ((typeof pageAppendData.endIndex === 'undefined') ?  startIndex:pageAppendData.endIndex)
            let result = 1
            for(let i=startIndex;i<=endIndex && !!result;++i) {
                result = copyContext.appendPDFPageFromPDF(i)
            }
            if(!result) {
                return new Error('failed to append page from')
            }
        } 
        else if(originType == 'TIFF') 
        {
            endIndex = allPages ? 
                (this.writer.getImagePagesCount(originPath)- 1) : 
                ((typeof pageAppendData.endIndex === 'undefined') ?  startIndex:pageAppendData.endIndex)
                            
            for(let i=startIndex;i<=endIndex;++i) {
                const imageDimensions = this.writer.getImageDimensions(originPath,i)
                const pdfPage = this.writer.createPage(0,0,imageDimensions.width,imageDimensions.height)
                const cxt = this.writer.startPageContentContext(pdfPage)
                cxt.drawImage(0,0,originPath)
                this.writer.writePage(pdfPage) 
            }
        }
        else {
            throw new Error(`Unrecognized source type for page appending = ${originType}`)
        }        

    }

    _renderItem(box, item, pageDriver) {
        switch(item.type)
        {
            case 'image': 
                this._renderImageItem(box, item, pageDriver)
                break
            case 'shape':
                this._renderShapeItem(box, item, pageDriver)
                break
            case 'text':
                this._renderTextItem(box, item, pageDriver)
                break
            case 'stream':
                this._renderStreamItem(box, item, pageDriver)
                break
        }        
    }

    _getLeftForAlignment(box, item) {
        if(!box.alignment || box.alignment == "left")
            return box.left

        if(box.alignment == "right")
            return box.left + box.width - this.measurements.getItemMeasures(item,box).width

        // center
        return box.left + (box.width - this.measurements.getItemMeasures(item,box).width)/2
    }

    _renderImageItem(box, item, pageDriver) {
        const opts = {}

        opts.index = item.index
        opts.transformation = item.transformation
        if(opts.transformation && !isArray(opts.transformation) &&
            !opts.transformation.width &&
            !opts.transformation.height)
        {
            opts.transformation.width = box.width
            opts.transformation.height = box.height
        }
        opts.password = item.password
    
        const imageItemMeasures = this.measurements.getImageItemMeasures(item)
    
        if(box.top !== undefined && box.bottom == undefined)
            box.bottom = box.top - (box.height !== undefined ? box.height:imageItemMeasures.height)
    
        const left = this._getLeftForAlignment(box,item)
        new EnhancedOptions(opts).transform()
        const imagePath = this.externalsMap.getExternalPath(item.source)
        if(imagePath)
            pageDriver.startContentContext().drawImage(left,box.bottom,imagePath,opts)	
    
        if(item.link)
            pageDriver.links.push({link:item.link,rect:[left,box.bottom,left+imageItemMeasures.width,box.bottom+imageItemMeasures.height]})
    }

    _renderShapeItem(box, item, pageDriver) {
        if(box.top !== undefined && box.bottom == undefined)
            box.bottom = box.top - (box.height !== undefined ? box.height:this.measurements.getShapeItemMeasures(item).height)
    
        const left = this._getLeftForAlignment(box,item)

        new EnhancedOptions(item.options).transform()
    
        switch(item.method)
        {
            case 'rectangle':
                pageDriver.startContentContext().drawRectangle(left,box.bottom,item.width,item.height,item.options)
                break
            case 'square':
                pageDriver.startContentContext().drawSquare(left,box.bottom,item.width,item.options)
                break
            case 'circle':
                // translate bottom/left to center
                pageDriver.startContentContext().drawCircle(left+item.radius,box.bottom+item.radius,item.radius,item.options)
                break
            case 'path': {
                // translate bottom left to paths points
                const args = item.points.slice()
                for(let i=0;i<args.length; i+=2)
                {
                    args[i]+=left
                    args[i+1]+=box.bottom
                }
                if(item.options)
                    args.push(item.options)
                const cxt = pageDriver.startContentContext()
                cxt.drawPath(...args)
                break
            }
        }
    }

    _renderTextItem(box, item, pageDriver) {
        const theFont =  this.documentText.getFontForItem(item)
        if(!theFont)
            return
        item.options.font = theFont // for convenience :)
    
        const theText = this.documentText.computeTextForItem(item)
    
        if(box.top !== undefined && box.bottom == undefined)
            box.bottom = box.top - (box.height !== undefined ? box.height:this.measurements.getTextItemMeasures(item).height)
    
        const left = this._getLeftForAlignment(box,item)
    
        new EnhancedOptions(item.options).transform()
        pageDriver.startContentContext().writeText(theText,left,box.bottom,item.options)
    
    
        if(item.link)
        {
            const measures = this.measurements.calculateTextDimensions(theFont,theText,item.options.size)
            pageDriver.links.push({link:item.link,rect:[left+measures.xMin,box.bottom+measures.yMin,left+measures.xMax,box.bottom+measures.yMax]})
        }
    }

    _renderStreamRun(text, start, limit, direction, style, state, pageDriver, left, top) {
        let itemMeasures
        if(style.type !== undefined) {
            // regular item, place using regular method, with a new box stating it's position
            let theItem
            if(style.type == 'text') {
                theItem = clone(style)
                theItem.text = text.substring(start,limit)
            } else {
                theItem = style
            }
            theItem.direction = direction
            const theBox = {
                left:left + state.xOffset,
                bottom:top + state.yOffset,
                items:[theItem]
            }
            this._renderItem(theBox, theItem, pageDriver)
            itemMeasures = this.measurements.getItemMeasures(theItem, theBox)
        } else {
            // a box (inline frame). create a copy of the box, and replace the xOffset and yOffset
            // ponder:replacing. should i add? right now will not support non-0 coordinates
            // of box...oh well...we still have to figure out what its good for anyways
            const newBox = clone(style)
            newBox.left = left + state.xOffset
            newBox.bottom = top + state.yOffset
            this._renderBox(newBox, pageDriver)
            itemMeasures = this.measurements.calculateBoxMeasures(newBox)
        }	
    
        state.xOffset += itemMeasures.width
        state.height = Math.max(state.height,itemMeasures.height)
    }

    _renderStreamItem(box, item, pageDriver) {
        if(box.top !== undefined && box.bottom == undefined)
            box.bottom = box.top - (box.height !== undefined ? box.height:0)

        const alignment = box.alignment === undefined ? (item.direction == 'rtl' ? 'right':'left'): box.alignment
        const baseTop = (box.top !== undefined ? box.top : (box.bottom + (box.height !== undefined ? box.height:0)))
        const baseLeft = box.left        
        let lineLeft

        new StreamObjectComposer().composeStreamItem(
            box.width,
            box.height,
            item,
            this.documentText,
            this.measurements,
            (text, start, limit, direction, style, state) => {
                this._renderStreamRun(text, start, limit, direction, style, state, pageDriver, lineLeft, baseTop)
            },
            (_direction, width) => {
                // use this to determine horizontal alignment
                // before a lign is rendered. when there's already knowledge
                // of the line width. setup alignment. the direction determines
                // the default if no alignment is defined
                if(alignment == 'center')
                    lineLeft = baseLeft + (box.width - width)/2
                else if(alignment == 'right')
                    lineLeft = baseLeft + (box.width - width)  
                else
                    lineLeft = baseLeft              
            }

        )
    }

    _renderBox(box, pageDriver) {
        new EhnhancedBox(box)
            .resolveVerticalOffsets(pageDriver, this.measurements)
            .resolveHorizontalOffsets(this.measurements)

        // render the box
        if(box.items)
        {
            box.items.forEach((item) => {
                this._renderItem(box, item, pageDriver)
            })
        }
        else if(box.image)
            this._renderImageItem(box, box.image, pageDriver)
        else if(box.shape)
            this._renderShapeItem(box, box.shape, pageDriver)
        else if(box.text)
            this._renderTextItem(box, box.text, pageDriver)
        else if(box.stream)
            this._renderStreamItem(box,box.stream, pageDriver)

        // collect box ID. collecting it after to allow reference in repeaters
        // [meaning, allow a later ID to override this ID]
        this.measurements.collectBoxId(box)
    }

    _createPage(page, accumulatedDims) {

        let pageDriver
        if(page.modifiedFrom !== undefined)
        {
            pageDriver = new ModifiedPageDriver(this.writer,page.modifiedFrom)
        }
        else
        {
            // accumulate required properties [syntax test]
            accumulatedDims.width = page.width || accumulatedDims.width
            accumulatedDims.height = page.height || accumulatedDims.height
            pageDriver = new NewPageDriver(this.writer,accumulatedDims.width,accumulatedDims.height)
        }
    
        pageDriver.links = [] // save links on page object. TODO:: setup on constructor and writePage should use them...

        page.boxes.forEach((box) => {
            this._renderBox(box,pageDriver)            
        })

        pageDriver.writePage(pageDriver.links)

    }

    _renderDocument(document) {
        const accumulatedDims = {
            width:null,
            height:null
        }

        document.pages.forEach((page) => {
            if(page.appendedFrom) {
                this._appendPage(page.appendedFrom)
            } else {
                this._createPage(page,accumulatedDims)
            }
        })
    }

    _getCopyingContext(path, options) {
        if(!this.copyingContexts[path])
            this.copyingContexts[path] = this.writer.createPDFCopyingContext(path, options)

        return this.copyingContexts[path]
    }    

    /*
        PDF rendering method. will create a pdf in output stream based on input document, and writer options.
        the extenalsmap is shared between rendering, to allow reusing the same files.

        provide this one at constructor:
            externalsMap - a simple key to value dict - an external label to a path (or two, for type 1 fonts)

        Parameters:
            document - Document object, describing the document structure and content
            outputStream - Target stream to write PDF file content to
            inOptions - generation options to pass to writer directly (things like pdf level, log n such)
    */    
    generatePDF(
        document,
        outputStream,
        pdfWriterOptions
    ) {
        const writerOptions = {
            ...createEngineOptions(document),
            ...pdfWriterOptions,
        }
        if(document.source) {
            this.writer = hummus.createWriterToModify(
                new hummus.PDFRStreamForFile(this.externalsMap[document.source]),
                outputStream,
                writerOptions
            )
        }
        else {
            this.writer = hummus.createWriter(outputStream, writerOptions)
        }

        // im deep cloning the document as going forward i'll update it's boxes, hang instances
        // on it, for convenience...so no need to affect the original
        const workDocument = cloneDeep(document)

        this.documentText = new DocumentText(this.writer, this.externalsMap)
        this.measurements = new DocumentMeasurements(workDocument, this.writer, this.documentText, this.externalsMap)

        this._renderDocument(workDocument)
        this.writer.end()

        this._cleanup()
    }


}

module.exports = PDFEngine
