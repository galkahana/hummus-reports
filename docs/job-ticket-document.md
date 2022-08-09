# Document

The top level object of the document description has the following schema:

````
{
    pages : [/* Array of page objects */]
    [protection] : {
        userPassword : "user password"
        [ownerPassword] : "owner password"
        [userProtectionFlag] : [/* array of permission keys */] 
    }
    [source] : "modified file label"
}
````

## pages

The `pages` array holds pages objects, each defining the content of a single page or describing how to append pages form another pdf. More on pages in [Pages](./job-ticket-pages.md).
A very simple document that contains a single page looks like this:

````
    {
        "pages": [
            {
                "width": 595,
                "height": 842,
		"boxes": [
			/* ... boxes forming the graphic content of the page ..*/
		]
            }
        ]
    }
````

A single page normally holds an array of boxes, to learn about boxes content go to [Boxes](./job-ticket-boxes.md).

## protection

If you want to require an opening user to provide a password before they can view the file add a `protection` object.
the `protection` object should have at least a `userPassword` key which states the password that the user should provide in order to open the document.
In addition you can define that there's only a limited set of actions that the user can carry with this PDF. For this you must provide an `ownerPassword` key and a `userProtectionFlag` key.
The `ownerPassword` key describes an admin password that if existing and different from the user password allows for limitation in actions.
`userProtectionFlag` describes the activities limitations. You can either provide it as a bitwise flag, or an array of strings, where each string is an ability.

If choose to provide strings place in the array one or more of the following strings: 

- `"allowPrint"` - allow printing of the document.
- `"allowModification"`- allow modifying the document in any way.
- `"allowCopy"` - allow copying strings from the document.
- `"allowAnnotations"` - allow adding, editing and removing annotations from the document.
- `"allowFilling"` - allow filling forms in the document.
- `"allowAccessibility"` - allow any options that are used for implementing accessibility capabilities for the document.
- `"allowAssemble"` - allow "asseumbling" the document, that is adding, removing and changing the order of pages in the document.
- `"allowPrintHighRes"`  - allow creating a high resolution print of the document. If not provided and only `"allowPrint"` is provided, than the printout will be of lower res (like rastered image, which still might be a good representation)

You can alternatively place a number as `userProtectionFalg` which will be a bitwise flag combining these options. The following maps the strings into numberal values:

````
{
	"allowPrint" : 1<<2,
	"allowModification": 1<<3,
	"allowCopy" : 1<<4,
	"allowAnnotations" : 1<<5,
	"allowFilling" : 1<<8,
	"allowAccessibility": 1<<9,
	"allowAssemble": 1<<10,
	"allowPrintHighRes": 1<<11 
}
````

To read more about protection options go to [Protection](./job-ticket-protection.md).

## source

If instead of creating a new PDF you would like to modify an existing PDF, provide a `source` key where its value should be a label. 
That label should be a key in the job ticket externals dictionary which value is a url to a PDF file - the PDF that you wish to modify.

Modification allows you to add new pages to the document by describing them in the `pages` array. Any page object will create a page that will be appended o the document.
You can also modify existing pages, adding content on top of their existing content. More on this in [Pages](./job-ticket-pages.md).

If the source document requires a password for opening it, use a `protection` object, as you would with a new object. Provide only `userPassword` in this case.
