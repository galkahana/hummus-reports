class EnhancedBox {
    constructor(box) {
        this.box = box
    }

    _normalizeTopOrigin(pageDriver) {
        // for box level pages, allow setting top per page top. convert here
        if(this.box.origin && this.box.origin == 'pageTop') {
            if(this.box.top)
                this.box.top = pageDriver.getPageHeight()-this.box.top
            if(this.box.bottom)
                this.box.bottom = pageDriver.getPageHeight()-this.box.bottom
            delete this.box.origin
        }
    }

    _computeTopFromAnchor(measurements, pageDriver) {
        if(typeof this.box.top == 'object')
            this.box.top = measurements.computeBoxTopFromAnchor(this.box.top, pageDriver)
    }    

    resolveVerticalOffsets(pageDriver, measurements) {
        this._normalizeTopOrigin(pageDriver)
        this._computeTopFromAnchor(measurements, pageDriver)

        return this
    }

    _computeLeftFromAnchor(measurements) {
        if(typeof this.box.left == 'object')
            this.box.left = measurements.computeBoxLeftFromAnchor(this.box.left)
    }     

    resolveHorizontalOffsets(measurements) {
        this._computeLeftFromAnchor(measurements)

        return this
    }
}


module.exports = EnhancedBox