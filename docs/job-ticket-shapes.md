# Shapes

You can draw shapes, and use them for line arts, backgrounds or borders. In Hummus Render, shapes, regardless of their role, are independent elements and have the same status as texts or images.  
To draw a shape provide a `shape` entry in a box. Its value should be an object defining the shape properties.   
For example, to following draws a rectangle:

```javascript
{
	"pages": [
		{
			"width": 595,
			"height": 842,
			"boxes": [
				{
					"bottom":10,
					"left":10,
					"shape" : {
						"method":"rectangle",
						"width":400,
						"height":300,
						"options": {
							"type":"fill",
							"color":"red"
						}

					}
				}
			]
		}
	]
}
```

The definition in the example places a red filled rectangle with the width of 400 and height of 300, at the position 10X10.

The following provides information about the available entries in a `shape` object.

## Method and method specific parameters

There are 4 possible shapes - rectangles, squares, circles or paths. Well...with paths you can create lots of shapes...so i guess there's more than 4.
In all cases the bottom,left of the box define the lower left corner of the shape.

The `method` property of the `shape` object defines the shape type. The following provides the values and additional parameters:

* `rectangle` - draws a rectangle. Add also a `width` and `height` properties to define its width and height
* `square` - draws a square. Define also `width` to set its edge measure.
* `circle` - draws a circle, which bottom left is in the box bottom left. Define `radius` to set the circles radius.
* `path` - draws a path through a series of points. The points are defined in an array value of a `points` entry. Each pair of numbers defines x and y coordinates in the path. The path runs through them. The points are defined in relation to the box left bottom corner.

## The options object

The options object in a shape entry defines styling options for the shape. It can have the following entries:
* `type` - either `stroke` or `fill`, for either drawing the shape, or filling it
* `colorspace` - `rgb`, `cmyk` or `gray`, for either colorspace. default is rgb.
* `color` - Either a string of the form "#XXXXXX" (like css) or a number of the form 0xXXXXX where each pair of hex numbers define a color component. The number of components is dependent on the colorspace chosen. For example, for RGB you'll have something like 0xFF45DE, which would mean 255 for Red, 69 for Green, and 222 for Blue.
* `width` - if you chose `stroke` for `type`, then this would provide the width of the line
* `close` - for a `path` method only, this option is a boolean that determines whether a path should be closed or not. This decision is mainly important if you are using the path as a 'stroke'

As an alternative to defining colors with numbers and color spaces, you can provide to `color` a named color, e.g. `pink`. In this case you don't have to provide a `colorspace` entry as the color that will be used is an RGB equivalent following the CSS color values. You can find the full table [here](https://github.com/galkahana/HummusJS/blob/master/src/CSSColors.h) [or in any css colors table found around the *deep* and *dark* web].
