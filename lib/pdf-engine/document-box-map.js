class DocumentBoxMap {
    constructor(document) {
        this.boxIDToBox = {}	
        this.document = document
    }

    _calculateBoxIDsToBoxes()
    {
        this.document.pages.forEach(function(page)
        {
            if(!page.boxes)
                return
            page.boxes.forEach(function(box) {
                if(box.id)
                    this.boxIDToBox[box.id] = box
            })
        })
    }

    getBoxByID(id) {
        // if mapping exists due to natural order of rendering, good. if not, loop now all boxes
        if(!this.boxIDToBox[id])
            this._calculateBoxIDsToBoxes()
        return this.boxIDToBox[id]
    }

    collectBoxId(box) {
        if(box.id)
            this.boxIDToBox[box.id] = box
    }    
}

module.exports = DocumentBoxMap 