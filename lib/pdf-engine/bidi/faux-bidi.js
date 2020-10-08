
const Reordered = {
    KEEP_BASE_COMBINING: 'KEEP_BASE_COMBINING'
}

const RTL = 1
const LTR = 0

class Paragraph {
    constructor(text, {paraLevel}) {
        this.paraLevel = paraLevel
        this.text = text

    }

    // get the end result text presentation per the visual presentation
    // eslint-disable-next-line no-unused-vars
    writeReordered(_reorderedFlag) { // passing Reordered.KEEP_BASE_COMBINING
        return this.text
    }

    // computed based paragraph level per the text received and initial setting
    getParaLevel() {
        return LTR
    }

    // count of different runs (directon changes) in the paragraph
    countRuns() {
        return this.runs
    }

    // get the logical run matching the input text position. for line breaking purposes.
    // will return the direct and the end of the run
    // eslint-disable-next-line no-unused-vars
    getLogicalRun(_startIndex) {
        return {
            logicalLimit: this.text.length,
            dir: 'ltr'
        }
    }



    // countRuns and getVisualRun are about querying Visual runs. count and get per index. 
    // each visual run holds where it start, in terms
    // of logical index of the origin text, and where it finishes, and the direction
 

    // eslint-disable-next-line no-unused-vars
    getVisualRun(_runIndex) {
        return {
            logicalStart: 0,
            length: this.text.length,
            dir: 'ltr'
        }
    }    

    // Creates a new pragraph object limiting to the input text indexes
    setLine(index, limit) {
        return new Paragraph(this.text.substring(index,limit), {paraLevel:this.paraLevel})
    }
}

module.exports = {
    Reordered,
    Paragraph: (...args) => new Paragraph(...args),
    RTL,
    LTR
}