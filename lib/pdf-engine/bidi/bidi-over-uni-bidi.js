const {resolve, reorder} = require('unicode-bidirectional/dist/unicode.bidirectional')

const Reordered = {
    KEEP_BASE_COMBINING: 'KEEP_BASE_COMBINING'
}

const RTL = 1
const LTR = 0

function findLevelEnd(levels, index) {
    let result = index
    let level = levels[index]
    while(levels[result] == level)
        ++result
    return result
}

function computeRuns(levels) {
    let currentRunLevel = null

    return levels.reduce((acc,level, index)=> {
        if(currentRunLevel == level) {
            acc[acc.length-1].length+=1
        }
        else {
            currentRunLevel = level
            acc.push({
                dir: level == 1 ? 'rtl': 'ltr',
                logicalStart: index,
                length: 1
            })
        }
        return acc
    },[])
}

class Paragraph {
    constructor(text, {paraLevel}) {
        this.paraLevel = paraLevel
        this.text = text
        this.codepoints = [...text].map((char)=>char.codePointAt(0))
        this.levels = resolve(this.codepoints, paraLevel)
        this.runs = computeRuns(this.levels)
    }

    // get the end result text presentation per the visual presentation
    // eslint-disable-next-line no-unused-vars
    writeReordered(_reorderedFlag) { // passing Reordered.KEEP_BASE_COMBINING
        return reorder(this.codepoints, this.levels).map((code)=>String.fromCodePoint(code)).join('')
    }

    // computed based paragraph level per the text received and initial setting
    getParaLevel() {
        return this.paraLevel
    }

    // count of different runs (directon changes) in the paragraph
    countRuns() {
        return this.runs.length
    }

    // get the logical run matching the input text position. for line breaking purposes.
    // will return the direct and the end of the run
    getLogicalRun(startIndex) {
        const result = {
            logicalLimit: findLevelEnd(this.levels, startIndex),
            dir: this.levels[startIndex] == 1 ? 'rtl': 'ltr'
        }
        return result
    }

    // countRuns and getVisualRun are about querying Visual runs. count and get per index. 
    // each visual run holds where it start, in terms
    // of logical index of the origin text, and where it finishes, and the direction
    getVisualRun(runIndex) {
        return this.runs[runIndex]
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