# Pages

The objects in the `pages` array define the pages in the resoult PDF.
Each object may describe one of 3 possible *things* :

1. A single page in a new PDF or a modified PDF (if this PDF is modified, it will be appended at its end)
2. A modified page in a modified PDF. In this case it will describe the contents to place as a top layer over the original page.
3. One or more appended pages from a PDF file or a TIFF image.

in any case, we'll see some pages in the result.

The simplest case, of a single Page, needs to define its width and height. The following decribes two empty pages, one A4 and the other US Letter:

````
    {
        "pages": [
            {
                "width": 595,
                "height": 842
            },
            {
                "width": 612,
                "height": 792
            }
        ]
    }
````

The measures are in points (1/72 of an inch).

To introduce content in the page you will add a `boxes` entry. on what can go in boxes you can read in [Boxes](./job-ticket-boxes.md).

## Appending pages from PDF or TIFF

PDF and TIFF documents may contain one or more "pages". You can add those pages into the new PDF. In such a case your Page object will NOT have `width` or `height` or `boxes`, rather it will look like this:

````
{
	"appendedFrom ": {
		"source":"source file label"
		"index": ['all'] (if defined can be 'all' or a numberal index)
		"endIndex": [index],
		"password":["pdf password"]
	}
}
````

`source` should contain a label that is a key in the job ticket externals dictionary, mapping to either a TIFF image or a PDF file url.  
`index` can be either `all` or a page index from which to start appending. If not defined `all` is used.  
`endIndex`, if defined, defines an ending page index. if Not defined an `index` is a number, it will be equal `index` and so - one page appended.  
Provide `password` if the source is a protected PDF file.

## Adding content on top of a modified document page

In the case of modifying an existing document (provided `source` at document level), you may want, instead of just appending pages to the original file, to add content on top of existing pages.
Here order doesn't matter. Add `modifiedFrom` entry to the page object where its value should be the original page index. Any box in the `boxes` array will be added on top of the existing page graphics.
No need to provide `width` and `height`. 
