# Images

Images may be just for display, but may also be clickable links.  
Supported image types are: JPG, TIFF, PDF, PNG. 

Transparent PNG images are supported, but note that transparency is not supported at this point for TIFF images. If you have means of creating a PDF from these images, you can import the PDF as an image and its transparency will be respected.

Here is an example of using an image:    

```javascript
{
	"pages": [
		{
			"width": 595,
			"height": 842,
			"boxes": [
				{
					"bottom": 300,
					"left": 100,
					"image": {
						"source":"logo",
						"transformation": [0.1, 0, 0, 0.1, 0, 0]
					}
				}
			]
		}
	]
}
```

The object model defines a single page of 595X842. In it there is a single box which is posited in 100X300. The coordinates are cartesian, bottom left origins in Points (1/72).

The images name is provided - **logo**. the `source` property value should match an entry in the job ticket externals dictionary.

The **transformation** key of the **image** object defines a transformation matrix. This is one of the methods to define a certain geometrical transformation on the image. In this example the image is scaled by 0.1 in both width and height. The transformation matrix is always 6 numbers as it the custom in PDF. You can use it to define also rotation, flipping, skewing or any two dimensional transformation that you want.

Now for a full reference of what you can put in an "image" object:

* `source` - The image. The value would be a label matching an entry in the job ticket externals dictionary. 
* `index`- in either the case of TIFF or PDF there might be multiple images in the same file. Use **index** to determine which one shows. It is 0 by default.
* `transformation` - transformation method. Can be either a array or an object. If it is a array, then transformation will be a 6 numbers matrix, allowing you to scale, rotate, translate or whatnot. If it is an object, than it is meant for defining an image fitting behaviour. You will define bounding with/height, and the module will scale the image in accordance. the object may have the following attributes:
    *  `width` - width of bounding box. Define either at container box object or transformation object.
    * `height` - height of bounding box. Define either at container box object or transformation object.
    * `proportional` - boolean, should the fit method maintain the image proportions?
    * `fit` - either `always` or `overflow`. If `always` Fit may always happen scaling up or down. If `overflow` fit will scale only if the image dimensions overflow the box.

Note that if you are using the fitting option for transformation you **must** define `width` and `height`. You can do this either at the container box object, or at the transformation object.

## Clickable links

You can have an image as a clickable link. Just provide a `link` property on the image item with the target URL, and you are set. For example:

```javascript
"image":
{
    "source":"CompanyLogo.jpg",
    "link":"https://www.CompanySite.com"
}
```  
