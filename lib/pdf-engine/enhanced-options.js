class EnhancedOptions {
    constructor(options) {
        this.options = options || {}
    }

    _transformColor() {
        const {color} = this.options

        // convert html color def #RRGGBB or #CCMMYYKK to number
        if(
            typeof color == 'string' && 
            color.length > 0 &&
            color.charAt(0) == '#'
        ) {
            this.options.color = parseInt(`0x${color.substring(1)}`)
        }
    }

    transform() {
        // some helpers that hummus doesn't come with
        this._transformColor()

        return this
    }
}


module.exports = EnhancedOptions