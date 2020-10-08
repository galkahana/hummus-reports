class PageDriver { 
    constructor() {
        this.links = []
    }

    startContentContext() {
        throw new Error('unimplemented')
    }

    getPageHeight() {
        throw new Error('unimplemented')
    }


    writePage() {
        throw new Error('unimplemented')
    }

}

module.exports = PageDriver