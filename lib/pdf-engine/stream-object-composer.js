const {isArray, clone} = require('lodash')
const bidi = require('./bidi')


var kDefaultInlineObjectChar = '?'

function trimTrialingSpaces({text, styles}) {
    const trailingSpacesStart = text.search(/[\s]*$/)
    
    if(trailingSpacesStart === text.length)
        return {text,styles}

    return {
        text: text.substring(0, trailingSpacesStart),
        styles: styles.slice(0, trailingSpacesStart)
    }
}

function hasNonSpace(text)
{
    return text.match(/[^\s]/)
}

/**
 * Takes a stream item and builds its paragraphs info. the end results is an array of paragraphs,
 * each containing: 
 * {
 *      text: string // the paragraph text
 *      styles: Array(textItem or inlineItem) with the same length of the text
 * }
 * 
 * The text string is simply the text of the pragraph. there's placeholder char for inline
 * objects.
 * The styles array provide information about the style of each character. at each location matching a text char
 * there's a style object that it should be drawn with. continuous runs of the same style should be drawn togather, as much as
 * possible, to retain the original intent of the user.
 * 
 * @param {*} streamItem 
 */

function createParagraphsData(streamItem)
{
    const paragraphs = []
    let currentText = ''
    let currentStyles = []
    let currentTextLength = 0

    streamItem.items.forEach(   
        (item) => {
            if(item.type == 'text')
            {
                // texts may have paragraphs finishing, analyse the text and finish paragraphs if necessary
                var theText = isArray(item.text) ? item.text.join('') : item.text
                // the following match matches either text with no line end, or any single line end
                var textComponents = theText.match(/[^\r\n]+|\r\n|\n|\r/g)
                if(textComponents) {
                    textComponents.forEach((text) => {
                        if(text.search(/\r|\n/) == -1) {
                            // text with no line ends, add
                            currentText+=text
                            currentTextLength+=text.length
                            for(let i=0;i<text.length;++i)
                                currentStyles.push(item)
                        } else {
                            // line ended, push paragraph
                            if(currentStyles.length == 0) {
                                // for empty line make sure the maintain the style for the newline height to be calculated
                                currentStyles.push(item)
                            }

                            paragraphs.push(trimTrialingSpaces({text:currentText,styles:currentStyles}))

                            // reset for next paragraph
                            currentText = ''
                            currentStyles = []
                            currentTextLength = 0

                        }
                    })
                }	
            }
            else
            {
                // non texts are simple "one character" objects
                currentText+=kDefaultInlineObjectChar
                currentTextLength+=1
                currentStyles.push(item)
            }
        })

    // close a final line if one exists
    if(currentTextLength > 0) {
        paragraphs.push(trimTrialingSpaces({text:currentText,styles:currentStyles}))
    }

    return paragraphs
}

function findRunLimit(offset, runs) {
    let limit = offset
    const run = runs[limit]
    while(limit < runs.length && run == runs[limit])
        ++limit

    return limit
}

function revFindRunLimit(rOffset, runs) {
    let limit = rOffset
    const run = runs[limit]
    while(limit >= 0 && run == runs[limit])
        --limit

    return limit  
}


class StreamObjectComposer {
    constructor() {

        // convenience accessors to input data
        this.leading = null
        this.boundsWidth = null
        this.boundsHeight = null
        this.item = null
        this.documentText = null
        this.measurements = null
        this.renderRunCB = null
        this.startLineCB = null

        // accumulated composition data
        this.state = {
            height: null,
            xOffset: null,
            yOffset: null,
            firstLine: null
        }

    }

    _resetLineState() {
        this.state.xOffset = 0
        this.state.height = 0
        this.state.firstLine = false
    }

    _lineSpacingModifier() {
        return this.state.firstLine? 1 : this.leading
    }

    _startLine(direction, width, height) {
        // before a lign is rendered. when there's already knowledge
        // of the line width. setup alignment. 

        // setup baseline for text placement
        this.state.height = height
        this.state.yOffset -= height * this._lineSpacingModifier()

        // saving item measures. helps with drawing...and measuring
        this.item.contentWidth = Math.max((this.item.contentWidth || 0), width)
        this.item.contentHeight = -this.state.yOffset

        if(this.startLineCB)
            this.startLineCB(direction, width, height)
    }

    _getRunMeasures(text, start, limit, direction, style) {
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
            const theBox = {left:0,bottom:0,items:[theItem]}
            itemMeasures = this.measurements.getItemMeasures(theItem, theBox)
            if(!this.state.firstLine && style.type == 'text') // when not the first relevant line height is actually the font size, not the text height
                itemMeasures.height = style.options.size
        } else {
            // a box. create a copy of the box, and replace the xOffset and yOffset
            // ponder:replacing. should i add? right now will not support non-0 coordinates
            // of box...oh well...we still have to figure out what its good for anyways
            const newBox = clone(style)
            newBox.left = this.state.xOffset
            newBox.bottom = this.state.yOffset
            itemMeasures = this.measurements.calculateBoxMeasures(newBox)
        }	
        return itemMeasures    
    }

    _getTextMeasures(p, text, styles)
    {
        // total text width. loop through logical runs
        let width=0, limit=0, height =0
    
        // external loop advances by logical runs
        while(limit < text.length)
        {
            // advance by logicalRun and style run, adding to width
            const logicalRun = p.getLogicalRun(limit)
    
            // internal loop advances by style runs
            while(limit < logicalRun.logicalLimit)
            {
                // get the width of the range result.limit...Math.min(result.stylesLimit,logicalRun.limit)
                const runLimit = Math.min(findRunLimit(limit, styles), logicalRun.logicalLimit)
                const runMeasures = this._getRunMeasures(text, limit, runLimit, logicalRun.dir, styles[limit])
    
                width+=runMeasures.width
                height = Math.max(height, runMeasures.height)
                limit = runLimit
            }
        }
    
        return {
            width,
            height
        }
    }
    
    _renderVisualRun(text, start, limit, direction, styles) {
        if(direction == 'ltr')
        {
            for(let i=start; i<limit;)
            {
                const runLimit = Math.min(findRunLimit(i, styles),limit)
                this.renderRunCB(text, i, runLimit, direction, styles[i], this.state)
                i=runLimit
            }
        }
        else
        {
            for(let i=limit-1; i>=start;)
            {
                const runLimit = Math.max(revFindRunLimit(i, styles),start)
                this.renderRunCB(text, runLimit, i, direction, styles[i], this.state)
                i=runLimit
            }
        }
    }
    
    _renderLine(p, text, start, styles) {
        // note that "p" contains the knowledge of text limit...hence no need to pass it
        const count = p.countRuns()
        for(let i=0; i<count; ++i) {
            const visRun = p.getVisualRun(i)
            this._renderVisualRun(
                text, 
                start + visRun.logicalStart, 
                start + visRun.logicalStart + visRun.length, 
                visRun.dir, 
                styles
            )
        }    
    }

    _getLineBreak(p, text, start, limit, styles) {
        /**
         * Find line break by iterating logical runs and style runs within them trying to add them as it goes till reaching
         * bounds width.
         */


        const result = {
            width: 0,
            height:0,
            limit: start // current text offset
        }
        let reachedBreak = false
        let reachedTextEnd = limit == start
	
        // external loop takes care of logical runs, where the direction is the same 
        while(!reachedTextEnd && !reachedBreak)
        {
            const logicalRun = p.getLogicalRun(result.limit)
            if(logicalRun.logicalLimit > limit) 
                logicalRun.logicalLimit = limit

            // internal loop take care of style runs within the logical run, so in the end
            // measurment is per style and direction.
            while(!reachedBreak && result.limit < logicalRun.logicalLimit)
            {
                // to save some computation, try to first add run in full, if unsuccesful, add word by word
                const runLimit = Math.min(findRunLimit(result.limit, styles), logicalRun.logicalLimit)
                const runStyle = styles[result.limit]
                const runMeasures = this._getRunMeasures(text, result.limit, runLimit, logicalRun.dir, runStyle)
                if((
                    result.width + runMeasures.width <= this.boundsWidth
                ) && (
                    this.boundsHeight == undefined || 
                    (this.boundsHeight + this.state.yOffset - runMeasures.height*this._lineSpacingModifier() >= 0)
                )){
                    // run in dir fits in full, so add it
                    result.width += runMeasures.width
                    result.height = Math.max(runMeasures.height, result.height)
                    result.limit = runLimit
                } else {
                    // ok. unable to add run in full. try adding word by word till hitting line bounds
                    const textComponentsStart = result.limit
                    let accumulatedWidth = 0
                    let accumulatedLimitAdd = 0
                    let accumulatedLimitAddToNonSpace = 0
                    const textComponents = text.substring(result.limit, runLimit).match(/[^\s]+|[^\S]+/g)
                    for(let i=0;!reachedBreak && i<textComponents.length; ++i)
                    {
                        const textComponentMeasures = this._getRunMeasures(
                            text, 
                            textComponentsStart, 
                            result.limit+accumulatedLimitAdd+textComponents[i].length,
                            logicalRun.dir,
                            runStyle
                        )
                        if((
                            result.width + textComponentMeasures.width <= this.boundsWidth
                        ) && (
                            this.boundsHeight == undefined || 
                            (
                                this.boundsHeight + this.state.yOffset - textComponentMeasures.height*this._lineSpacingModifier() >= 0
                            )
                        )) {
                            // word fits, so add and continue
                            accumulatedLimitAdd+=textComponents[i].length
                            if(hasNonSpace(textComponents[i]))
                            {
                                accumulatedWidth=textComponentMeasures.width // add space to width ONLY when a later non space would show up. this should fix up the alignment problem nicely
                                accumulatedLimitAddToNonSpace = accumulatedLimitAdd
                            }
                            result.height = Math.max(textComponentMeasures.height,result.height)
				
                        } else {
                            // done here
                            reachedBreak = true
                        }
                    }
                    // add accumulated width/range of what of the text that got in. take the measures so that will trim any ending spaces
                    result.width+=accumulatedWidth
                    result.limit+=accumulatedLimitAddToNonSpace
                    // mark break, just in case run fit without the trailing spaces...
                    reachedBreak == true
                }
            }

            reachedTextEnd = logicalRun.logicalLimit == limit
        }

        // overflow happens when we cant add a single char. which means one of two things:
        // - we passed the box bottom (and there was one defined...)
        // - we cant fit the next letter in an empty row. given the assumption of consistent width
        //   this woudl mean that it wont fit in any next line either. so - overflow.
        result.verticalOverflow = (start == result.limit) 

        return result
    }

    _composeParagraphWithContent(paragraphData) {
        const {text, styles} = paragraphData

        const p = bidi.Paragraph(text,{paraLevel: this.item.direction == 'rtl' ? bidi.RTL:bidi.LTR})
        const textLength = text.length
        const paraLevel= 1 & p.getParaLevel()
        const direction = (paraLevel == bidi.RTL) ? 'rtl':'ltr'

        const measures = this._getTextMeasures(p, text, styles)

        if(
            measures.width <= this.boundsWidth && 
            (
                this.boundsHeight == undefined ||  
                (this.boundsHeight + this.state.yOffset - measures.height*this._lineSpacingModifier() >= 0)            
            )
        ) {
            // everything fits onto one line	
            // prepare rendering a new line from either left or right
            this._startLine(direction, measures.width, measures.height)
            this._renderLine(p, text, 0, styles)
            this._resetLineState()
            return true
        } else {
            let rw = {
                limit:null, 
                width:null,
                height:null,
                verticalOverflow:false
            }
            for(let start = 0;start < textLength;)
            {
                rw =  this._getLineBreak(p, text, start, textLength, styles)
                if(rw.verticalOverflow)
                    break

                const line = p.setLine(start, rw.limit)
                this._startLine(direction, rw.width, rw.height)
                this._renderLine(line, text, start, styles)
                this._resetLineState()

                start = rw.limit

                // for all but first line, skip leading spaces
                const nonSpaceIndex = text.substr(start).search(/[^\s]/)
                if(nonSpaceIndex != -1)
                    start+= nonSpaceIndex
            }
            return rw.verticalOverflow
        }
    }

    _composeEmptyParagrpah(paragraphData) {
        const font = this.documentText.getFontForItem(paragraphData.styles[0])
        if(!font) {
            // i should throw?
            return false
        }
        const lineHeight = font.calculateTextDimensions('d',paragraphData.styles[0].options.size).yMax
        if(this.boundsHeight !== undefined &&  (this.boundsHeight + this.state.yOffset - lineHeight*this._lineSpacingModifier() < 0)) {
            // overflow
            return false
        }
            
        this._startLine(this.item.direction, 0, lineHeight)
        // nothing to render...so no need to call here to "render"
        this._resetLineState()
        return true
    }

    _composeParagraph(pragraphData) {
        if(pragraphData.text.length > 0) {
            return this._composeParagraphWithContent(pragraphData)
        }
        else
        {
            return this._composeEmptyParagrpah(pragraphData)
        }
    }

    composeStreamItem(
        boundsWidth,
        boundsHeight,
        item,
        documentText,
        measurements,
        renderRunCB,
        startLineCB
    ) {
        const paragraphsData = createParagraphsData(item)

        this.state = {
            height: 0, // current line height
            xOffset: 0, // current line horizontal offset
            yOffset: 0, // current vertical offset (total) - will be negative! (so neg for content height)
            firstLine: true, // first line indication (to use ascent instead of leading)
        }
        
        // and save some inputs
        this.leading = item.leading || 1.2
        this.boundsWidth = boundsWidth
        this.boundsHeight = boundsHeight
        this.item = item
        this.documentText = documentText
        this.measurements = measurements
        this.renderRunCB = renderRunCB
        this.startLineCB = startLineCB

        let composedOK = true
        for(let i=0;i<paragraphsData.length;++i) {
            // will break on overflow
            if(!this._composeParagraph(paragraphsData[i])) {
                composedOK = false
                break
            }
        }

        return composedOK
    }
}

module.exports = StreamObjectComposer