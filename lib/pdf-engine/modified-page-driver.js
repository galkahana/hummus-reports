var hummus = require('hummus')
const PageDriver = require('./page-driver')

class ModifiedPageDriver extends PageDriver {
    constructor(writer,pageIndex) {
        super()
        this.pdfPageInput = writer.getModifiedFileParser().parsePage(pageIndex)
        this.pageModifier = new hummus.PDFPageModifier(writer,pageIndex,true)
    }

    startContentContext() {
        return this.pageModifier.startContext().getContext()
    }

    getPageHeight() {
        const mediaBox = this.pdfPageInput.getMediaBox()
        return mediaBox[3]-mediaBox[1]
    }

    writePage()
    {
        if(this.pageModifier.getContext())
            this.pageModifier.endContext()
    
        this.links.forEach((link) => {
            this.pageModifier.attachURLLinktoCurrentPage(link.link,...link.rect)
        })		
    
        this.pageModifier.writePage()
    }    
}


module.exports = ModifiedPageDriver