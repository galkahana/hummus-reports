const {isArray, clone} = require('lodash')

const DocumentBoxMap = require('./document-box-map')
const StreamObjectComposer = require('./stream-object-composer')
const {transformBox} = require('./vector-math')
const EnhancedBox = require('./enhanced-box')

function getBoxItemType(box)
{
    if(box.text)
        return 'text'
    
    if(box.shape)
        return 'shape'
    
    if(box.image)
        return 'image'

    return 'stream'
}

function hasNonSpace(text)
{
    return text.match(/[^\s]/)
}


class DocumentMeasurements {

    constructor(document, writer, documentText, externalsMap) {
        this.document = document
        this.documentText = documentText
        this.documentBoxMap = new DocumentBoxMap(document)
        this.writer = writer
        this.externalsMap = externalsMap
    }


    collectBoxId(box) {
        // call this method as rendering goes to allow later boxes to anchor to it
        this.documentBoxMap.collectBoxId(box)
    }

    getImageItemMeasures(item) {
        // note that below, any derivation of the transformation width/height from the box width/height should have already happened

        let result
        const imagePath = this.externalsMap.getExternalPath(item.source)
	
        if(item.transformation)
        {
            if(isArray(item.transformation))
            {
                if(imagePath)
                {
                    const imageDimensions = this.writer.getImageDimensions(imagePath,0,{password:item.password})
                    const bbox = [0,0,imageDimensions.width,imageDimensions.height]
                    const transformedBox = transformBox(bbox,item.transformation)
                    result = {width:transformedBox[2],height:transformedBox[3]}
                }
                else
                    result = {width:0,height:0}
            }
            else
                result = {width:item.transformation.width,
                    height:item.transformation.height}
        }
        else if(imagePath)
            result = this.writer.getImageDimensions(this.externalsMap.getExternalPath(item.source),0),{password:item.password} 
        else
            result = {width:0,height:0} 

        return result
    }

    _doesBoxHaveStream(box) {
        if(box.items)
            return box.items.filter((item) => item.type === 'stream').length > 0
        else 
            return box.stream
    }

    _calculateBoxItemsHeight(box) {
        return this.calculateBoxMeasures(box).height
    }

    _getBoxBottom(box, pageDriver)
    {
        // first, make sure we got the initial anchoring and origin of top resolved
        // this has happened already if this box was rendered, but at times it could be
        // that we're asking to anchor per not yet rendered box, so computations are required
        new EnhancedBox(box).resolveVerticalOffsets(pageDriver, this)

        // bottom exists and solid, return bottom
        if(box.bottom !== undefined && !(box.height === undefined && this._doesBoxHaveStream(box)))
            return box.bottom
    
        // bottom does not really exist, need to calculate per top and height
        if(box.top !== undefined)
        {
            return box.top - (box.height !== undefined ? box.height : this._calculateBoxItemsHeight(box))
        }
        else if(box.bottom !== undefined && box.height === undefined)
        {
            // bottom with undefined height actually makes it top, so use the same calculation as above in top with no height
            return box.bottom - this._calculateBoxItemsHeight(box)
        }
        else
            return 0 // undefined box top and bottom
    }    

    computeBoxTopFromAnchor({box, offset}, pageDriver) {
        const theAnchoredBox = (typeof(box) == 'object') ? box : this.documentBoxMap.getBoxByID(box)
        return this._getBoxBottom(theAnchoredBox, pageDriver) + (offset || 0)
    }

    _calculateBoxItemsWidth(box) {
        return this.calculateBoxMeasures(box).width
    }

    _getBoxRight(box) {
        new EnhancedBox(box).resolveHorizontalOffsets(this)

        return box.left + (box.width !== undefined ? box.width : this._calculateBoxItemsWidth(box))
    }

    computeBoxLeftFromAnchor({box, offset}) {
        const theAnchoredBox = (typeof(box) == 'object') ? box : this.documentBoxMap.getBoxByID(box)
        return this._getBoxRight(theAnchoredBox) + (offset || 0)
    }

    getItemMeasures(item, box) {
        let result
        const itemType = item.type ? item.type : getBoxItemType(box)
        switch(itemType)
        {
            case 'image': 
                result = this.getImageItemMeasures(item)
                break
            case 'shape':
                result = this.getShapeItemMeasures(item)
                break
            case 'text':
                result = this.getTextItemMeasures(item)
                break
            case 'stream':
                result = this.getComposedStreamMeasures(box, item)
                break
        }
    
        return result	
    }

    getShapeItemMeasures(item) {
        let result

        switch(item.method)
        {
            case 'rectangle':
                result = {width:item.width,height:item.height}
                break
            case 'square':
                result = {width:item.width,height:item.width}
                break
            case 'circle':
                result = {width:item.radius*2,height:item.radius*2}
                break
            case 'path': {
                let maxTop=0
                let maxRight=0
                for(let i=0;i<item.points.length;i+=2)
                {
                    if(item.points[i]> maxRight)
                        maxRight = item.points[i]
                    if(item.points[i+1]>maxTop)
                        maxTop = item.points[i+1]
                }
                result = {width:maxRight,height:maxTop}
                break
            }
            default:
                result = {width:0,height:0}
        }	
        return result
    }

    calculateTextDimensions(font, text, fontSize) {
        // calculate the text measures. handles a bug where space only strings don't get their correct measures
        if(hasNonSpace(text))
        {
            // may be ending with space, in which case i'll get the same problem as having spaces...so do a similar trick..with no height this time
            if(text.search(/[\s]*$/) != text.length)
            {
                const measures = font.calculateTextDimensions(text+'a',fontSize)
                const measuresA = font.calculateTextDimensions('a',fontSize)
                measures.width-=measuresA.xMax
                measures.xMax-=measuresA.xMax
                return measures
            }
            else
                return font.calculateTextDimensions(text,fontSize)
        }
        else
        {
            const measures = font.calculateTextDimensions('a'+text+'a',fontSize)
            const measuresA = font.calculateTextDimensions('aa',fontSize)
            const dMeasure = font.calculateTextDimensions('d',fontSize)
            dMeasure.width = measures.width-measuresA.width
            dMeasure.xMin = 0
            dMeasure.xMax = dMeasure.width
            return dMeasure
        }
    }

    getTextItemMeasures(item) {
        const theFont = this.documentText.getFontForItem(item)
        const theText = this.documentText.computeTextForItem(item)
        if(theFont && theText.length > 0) {
            const measures =  this.calculateTextDimensions(theFont,theText,item.options.size)
            // note, taking yMax, and not height, because we want the ascent and not the descent, which is below the baseline!
            // also taking xMAx...cause i want the advance and not just the start to end glyphs area
            return {width:measures.xMax,height:measures.yMax} 
        } else {
            return {width:0,height:0}
        }
    }

    calculateBoxMeasures(box) {
        if(box.height !== undefined && box.width !== undefined)
            return {width:box.width,height:box.height}
        else
        {
            let itemsMeasures
            if(box.items)
            {
                itemsMeasures = {width:0,height:0}
                box.items.forEach((item) => {
                    const itemMeasures = this.getItemMeasures(item,box)
                    itemsMeasures.height = Math.max(itemMeasures.height,itemsMeasures.height)
                    itemsMeasures.width+=itemMeasures.width
                })
            } else {
                itemsMeasures =  this.getItemMeasures(box.image || box.shape || box.text || box.stream,box)
            }
            return {
                width:box.width === undefined ? itemsMeasures.width:box.width,
                height:box.height === undefined ? itemsMeasures.height:box.height
            }
        }
    }

    _computeStreamRun(text, start, limit, direction, style, state)
    {
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
            const theBox = {left:state.xOffset,bottom:state.yOffset,items:[theItem]}
            itemMeasures = this.getItemMeasures(theItem,theBox)
        } else {
            // a box. create a copy of the box, and replace the xOffset and yOffset
            // ponder:replacing. should i add? right now will not support non-0 coordinates
            // of box...oh well...we still have to figure out what its good for anyways
            var newBox = clone(style)
            newBox.left = state.xOffset
            newBox.bottom = state.yOffset
            itemMeasures = this.calculateBoxMeasures(newBox)
        }	
    
        state.xOffset += itemMeasures.width
        state.height = Math.max(state.height, itemMeasures.width)
    }    

    getComposedStreamMeasures(box, item) {
        // composition saves the total height in contentHeight. if not done yet, compose on empty and save now.
        if(typeof item.contentHeight == 'undefined')
            new StreamObjectComposer().composeStreamItem(
                box.width,
                box.height,
                item,
                this.documentText,
                this,
                (text, start, limit, direction, style, state) => {
                    this._computeStreamRun(text, start, limit, direction, style, state)
                })
        return {
            width: item.contentWidth,
            height: item.contentHeight
        }
    }

}

module.exports = DocumentMeasurements