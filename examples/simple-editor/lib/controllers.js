const path = require('path')
const { PDFEngine } = require('../../../')
const { PDFStreamForResponse } = require('hummus')

const ASSETS_FOLDER = '../assets'

const ASSETS_MAP = {
    '!': path.resolve(__dirname, ASSETS_FOLDER, '!.pdf'),
    'pngLogo': path.resolve(__dirname, ASSETS_FOLDER, 'original.png'),
    'roboto-regular': path.resolve(__dirname, ASSETS_FOLDER, 'Roboto-Regular.ttf'),
    'roboto-light': path.resolve(__dirname, ASSETS_FOLDER, 'Roboto-Light.ttf'),
    'roboto-bold': path.resolve(__dirname, ASSETS_FOLDER, 'Roboto-Bold.ttf')
}


const generatePDFPreview = (req, res) => {
    const engine = new PDFEngine(ASSETS_MAP)
    res.writeHead(200, {'Content-Type': 'application/pdf'})
    engine.generatePDF(req.body, new PDFStreamForResponse(res))
    res.end()

}

module.exports = {
    generatePDFPreview
}