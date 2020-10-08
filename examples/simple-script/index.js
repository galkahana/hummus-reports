const mkdirp = require('mkdirp')
const path = require('path')
const { PDFWStreamForFile } = require('hummus')
const { PDFEngine } = require('../../')


const ASSETS_FOLDER = './assets'

async function createPDFFile() {
    const jobTicket = require('./assets/documentForReport.json')
    const assetsMap = {
        '!': path.resolve(__dirname, ASSETS_FOLDER, '!.pdf'),
        'pngLogo': path.resolve(__dirname, ASSETS_FOLDER, 'original.png'),
        'roboto-regular': path.resolve(__dirname, ASSETS_FOLDER, 'Roboto-Regular.ttf'),
        'roboto-light': path.resolve(__dirname, ASSETS_FOLDER, 'Roboto-Light.ttf'),
        'roboto-bold': path.resolve(__dirname, ASSETS_FOLDER, 'Roboto-Bold.ttf')
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
