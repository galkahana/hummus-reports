const mkdirp = require('mkdirp')
const path = require('path')
const { PDFWStreamForFile } = require('hummus')
const { PDFEngine } = require('../../')

async function createPDFFile() {
    const jobTicket = require('./assets/documentForReportBidi.json')
    const assetsMap = {
        'pngLogo': path.resolve(__dirname, './assets/Logo in Menu.png'),
        'roboto-regular': path.resolve(__dirname, './assets/Roboto-Regular.ttf'),
        'roboto-light': path.resolve(__dirname, './assets/Roboto-Light.ttf'),
        'roboto-bold': path.resolve(__dirname, './assets/Roboto-Bold.ttf'),
        'ploni-regular': path.resolve(__dirname, './assets/PloniDL1.1AAA-Regular.otf')
    }

    const engine = new PDFEngine(assetsMap)
    await mkdirp(path.resolve(__dirname,'./output/'))
    engine.generatePDF(jobTicket.document.embedded, new PDFWStreamForFile(path.resolve(__dirname,'./output/result.pdf')))
}


console.log('starting')
createPDFFile().then(()=> {
    console.log('finished ok')
}).catch((ex)=> {
    console.log('finished bad')
    console.log(ex)
})
