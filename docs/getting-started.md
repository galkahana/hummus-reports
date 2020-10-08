# Getting Started

To generate a PDF file with the engine use its `PDFEngine` class:

```javascript
// Key value map of labels to file paths
const assetsMap = {}
// a hummusjs stream to write the file to
const outputStream = new hummus.PDFWStreamForFile(path.resolve(__dirname,'./result.pdf')) 
const document = "{
  "pages": [
    {
      "width": 595,
      "height": 842
    }
  ]
}" // A Document description
          

const engine = new PDFEngine(assetsMap)
engine.generatePDF(document, outputStream)
```

This will generate a pdf document with a single empty page in it.

The following explains the different elements in this code

## `PDFEngine.generatePDF` method

The PDFEngine class functions as a generator of pdf files. 
It has a single method that is generating a PDF output named `generatePDF`. The method is synchronous and has 2 required parameters and 1 optiona parameter:
1. **document** - a JSON document that describes the layout and content of the PDF to generate. To learn more about the document format go [here](./job-ticket-document.md), though first let's get the API out of the way, so plz...later.
2. **outputStream** - a HummusJS output stream. This is where the PDF output will go to. You will mostly use `hummus.PDFWStreamForFile` or `hummus.PDFStreamForResponse`. The former can be used to write to and output file, and the latter can be used to write to any Node write stream, where a notable example is the http/express response, meaning that you can write PDF content directly as a reponse, without having to maintain local files. You can implement your own streams, to further customize output. If you want to, read more about [custom streams](https://github.com/galkahana/HummusJS/wiki/Custom-streams).
3. **[hummusWriterOptions]** - Mostly for debugging purposes you might want to pass creation options for the hummus writer object used in the PDF engine. You can do so by providing those options as a third parameter. Those options are described [here](https://github.com/galkahana/HummusJS/wiki/Basic-pdf-creation#create-pdfs).

## Assets Map and `PDFEngine` constructor

The `PDFEngine` constructor accepts a key value dictionary that maps assets labels to file paths. The assets can be images and fonts. The keys of the dictionary can be used in later generated document JSONs to provide actual files for named resources.
The values are file paths. Most of the times there would be a single file path matching a resource. The only exception is when Type 1 fonts are used. In this case provide a value which is an array of two elements - a path for the PFB file and a path for the PFM file.

## Next

To learn more about the format of the document object start from [here](./job-ticket-document.md).
