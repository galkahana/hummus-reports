const PageDriver = require("./page-driver")


class NewPageDriver extends PageDriver {
    constructor(writer,width, height) {
        super()
        this.writer = writer
        this.pdfPage = writer.createPage(0,0,width,height)
        this.height = height
    }

    startContentContext() {
        return this.writer.startPageContentContext(this.pdfPage)
    }

    getPageHeight() {
        return this.height
    }

    writePage()
    {
        if(this.links.length > 0)
        {
            this.writer.pausePageContentContext(this.writer.startPageContentContext(this.pdfPage))
            this.links.forEach((link) => {
                this.writer.attachURLLinktoCurrentPage(link.link,...link.rect)
            })
        }

        this.writer.writePage(this.pdfPage)
    }
}


module.exports = NewPageDriver