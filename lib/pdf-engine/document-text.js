const {isArray} = require('lodash')
const bidi = require('./bidi')

class DocumentText {
    constructor(writer, externalsMap) {
        this.writer = writer
        this.externalsMap = externalsMap
        this.cache = {}
    }

    computeTextForItem(item) {
        const p = bidi.Paragraph(
            isArray(item.text) ? item.text.join('') : item.text,
            {
                paraLevel: item.direction == 'rtl' ? bidi.RTL : bidi.LTR
            }
        )
        return p.writeReordered(bidi.Reordered.KEEP_BASE_COMBINING)
    }

    _getFontForFile(fontPath, secondArg) {
        const key = `${fontPath},${secondArg}`

        if(!this.cache[key]) {
            this.cache[key] = secondArg ? this.writer.getFontForFile(fontPath, secondArg) : this.writer.getFontForFile(fontPath)
        }

        return this.cache[key]
    }
    
    getFontForItem(item) {
        let result
        if(!item.options)
            return null

        const fontPaths = this.externalsMap.getExternalPath(item.options.fontSource)
        if(fontPaths)
        {
            const fontPath = (typeof fontPaths === 'string') ? fontPaths : (fontPaths.length ? fontPaths[0]:null)
            if(!fontPath) {
                // shouldn't happen, but giving another chance
                result = item.options.font
            }
            else {
                const secondPath = (typeof fontPaths !== 'string' && fontPaths.length == 2) ? fontPaths[1]:null
                const secondArg = secondPath ? (secondPath) : ((item.options && item.options.fontIndex) ? item.options.fontIndex : null)
                
                return this._getFontForFile(fontPath, secondArg)
            }
        }
        else
            result = item.options.font

        return result
    }    
}


module.exports = DocumentText