# Modifying PDFs

Instead of creating a new PDF you can create a modified version of an existing PDF. For example, you can add an overlay of text on top of existing PDF pages.

The engine allows for two types of modifications:

1. Appending new pages to an existing PDF
2. Adding content on top of existing pages in the PDF.

Both options are implemented using the `pages` array of the document.

## Defining the modified PDF

To define the PDF that is being modified, add a `source` entry to the document object (same level of `pages`). As its value provide a label that points to that PDF. The label will match an entry in the job ticket externals dictionary which value is the PDF url.

## Appending pages to the PDF

To append pages to the PDF create page objects in the `pages` array. Each object that you defined (unless it has `modifiedFrom`) will be appended to the original PDF, per the order in the `pages` array.

## Adding overlay content to existing pages

You can also add content on top of existing pages content. For each page that you want to add content to create a page object with the required content additions, and also add a `modifiedFrom` entry, which value
should be the page index. There is no importance to the order of `pages` that have `modifiedFrom` entry.
