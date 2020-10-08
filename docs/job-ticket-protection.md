# Password Protection

PDF files may be encrypted, and require a password for opening them.
The engine supports passwords in the following ways:

1. You can create PDF files with passwords
2. You can modify PDF files with passwords
3. You can copy pages from PDF files that are password protected
4. You can use PDF pages that are password protected as images

## Creating a PDF that is password protected

If you want to require an opening user to provide a password before they can view the file add a `protection` object to the `document` object.
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

## Modifying a PDF that is protected by a password

Creating a modified version of an existing PDF is carried out by providing a `source` entry in the `document` object.  
If the PDF is protected with a password, you should provide that password, so that it can be opened. Use the `protection` object describe in the previous entry, with just a `userPassword` entry which should hold the password.

## Copying pages from password protected PDFs

When defining a `page` object you can state that you'd like to append pages from another PDF. use the `appendedFrom` entry for that. If that PDF requires a password for opening, Provide a `password`
entry with that password.

## Using password proected PDF files as images

You can create Image boxes from PDFs that have password protection. In this case in the item definition, next to `source` provide another `password` entry with the password.
