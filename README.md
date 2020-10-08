# Hummus reports

Hello!
This repo hosts an engine that can generate reports. It does that using a PDF library named hummus, and a layout engine that helps with things like text wrapping, image fitting, and provide a json document layout, instead of the hummus command-based api.

# Engine documentation

You can find documentaiton on how to use the engine in the documents section of this project.
Here's a TOC:

- [Getting Started](./docs/getting-started.md)
- [The root Document](./docs/job-ticket-document.md)
- [Document Pages](./docs/job-ticket-pages.md)
- [Page boxes](./docs/job-ticket-boxes.md)
- [Drawing Primitive Shapes](./docs/job-ticket-shapes.md)
- [Showing images](./docs/job-ticket-images.md)
- [Placing text](./docs/job-ticket-text.md)
- [Wrapping text and inline boxes](./docs/job-ticket-streams.md)
- [Modifying existing PDF files](./docs/job-ticket-modification.md)
- [Encrypting PDF files and Using encrypted PDF files](./docs/job-ticket-protection.md)


# Installation

```bash
npm install hummus-reports
```

# Samples

The project has two samples provided:
1. [simple-script](./examples/simple-script) - A basic script that generates a PDF file, with assets map example. The output is made to a file.
2. [simple-editor](./examples/simple-editor) - A simple preview-and-generate server and site, allowing you to quickly edit and preview documents. The output of the PDF is provided directly to the stream, which in turn is used as a data uri in the client code. If you intend to run this project independently make sure to update its reference to this project as it is now relative to this project root.



# Development

## Folders structure
The folders structure is as follows:

1. `./index.js` - root file for exporting `PDFEngine` class
2. `./lib/pdf-engine folder` - implementaiton of the pdf engine. root is [`pdf-engine.js`](./lib/pdf-engine/pdf-engine.js).

## Warning! native module ahead

HummusJS is a native module. This means that this code can only be ran on a  NodeJS service, and is not a cross-platform javascript module. 
