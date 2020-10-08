# Text

Placing text is quite simple. Just state the text, Provide font, color and size. Here is an example:

```javascript
{
	"pages": [
		{
			"width": 595,
			"height": 842,
			"boxes": [
				{
					"bottom": 500,
					"left": 10,
					"text": {
						"text": "hello world",
						"options": {
			                                "fontSource": "arial",
                           				"size": 40,
							"color": "pink"
						}
					}
				}
			]
		}
	]
}
```

The box container of the text places it at 500X10. The text features are defined in the `text` entry:
the `text` property provides the text, here - "hello world". 
The options object provides the features, in this case the font will be a service provided arial true type. Size is 40 and the color of the text will be pink.

In addition to coloring the text and defining font and size, you can also have underline for the text, and specify it as a clickable link. Bidirectional text is supported.

## Fonts

Fonts can be defined via the `fontSource` entry. As with other cases the value of this entry is a label matching an entry in the job ticket externals dictionary.
Most of the value will be a path of a single file. For type 1 fonts you will want to use both the PFB and PFM file (if you have the PFM file, that is). If this is the case, provide an array as the value in the externals dictionary which will have two strings with the PFB and PFM files in accordance.

For dfont and ttc fonts you will also want to define the index of the desired font in the package. add `fontIndex` for this directly under `options`.

## Unicode, Ligature and OTF special effects  support

You can place any unicode text, if the font that you are using has unicode mapping. Most fonts do.
Ligatures at this point are not supported.
Right to left writing and Bidirectional text is supported, though position-aware glyph changing (like in Arabic) is not supported. 

## Defining color

The `options` object allows also the definition of the text color through two properties:

* `colorspace` - `rgb`, `cmyk` or `gray`, for either colorspace. default is rgb.
* `color` - Either a string of the form "#XXXXXX" (like css) or a number of the form 0xXXXXX where each pair of hex numbers define a color component. The number of components is dependent on the colorspace chosen. For example, for RGB you'll have something like 0xFF45DE, which would mean 255 for Red, 69 for Green, and 222 for Blue.
As an alternative to defining colors with numbers and color spaces, you can provide to `color` a named color, e.g. `pink`. In this case you don't have to provide a `colorspace` entry as the color that will be used is an RGB equivalent following the CSS color values. You can find the full table [here](https://github.com/galkahana/HummusJS/blob/master/src/CSSColors.h) [or in any css colors table found around the *deep* and *dark* web].

## More

The `options` object has additional properties:

* `size` - number. determines the size of the text.
* `direction` - 'ltr' or 'rtl' ('ltr' by default) indicates the direction of the text. This is the equivalent of the 'dir' property in HTML and the writing direction in any Desktop application, and should provide the same results.
* `underline` - true or false. either have and underline, or don't.

Besides the `options` object there is a `text` property that sets the text to display. For the sake of convenience you can provide either a string or an array of strings. When the value is an array it is equivalent to concatenating the array strings and providing the concatenated value.
Bidirectional text is supported in full. You will optionally need to provide a `direction` specification in the `options` object in order to convey the writing direction you have in mind. This will be equivalent to any application writing direction setting on a text field. ICU Bidi algorithm is used under the hood.

## Clickable links

If you are looking to make this text a clickable link (say, as a URL designation or mailto instruction) you just need to add a link attribute with the URL, for example consider this text item definition:

```javascript
{
    "text":"Jane Doe",
    "options": {
         "fontSource":"myArial",
         "size": 13,
         "color":"blue",
         "underline":true
    },
    "link":"mailto:hello@gmail.com"
}
```

Note the usage of color and underline to provide an HTML-like clickable link. The `text` field provide the text to show, while the `link` field has the URL that will be triggered when the link is clicked.  
