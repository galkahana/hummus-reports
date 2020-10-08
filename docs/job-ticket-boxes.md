# Boxes

Boxes are containers of graphics on a page. Any non-empty page will contain an entry of `boxes` and in it one or more `boxes` objects. 
Each box object has a definition of `left` and `bottom` entries that define its lower left position (there are options to define other offsets, e.g. using top instead of bottom, read below in "Alternative Positioning"). This serves as base to posit the contents of the box.

Following is an example of a document with a box object:     

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

The box is defined to be placed at 10X10, and it is to have a content that is a shape of  rectangle. The types of contents that you can put in a box, and therefore what entries can be there are:    
* [Text](./job-ticket-text.md) - `text`
* [Images](./job-ticket-images.md) - `image`
* [Shapes](./job-ticket-shapes.md) - `shape` (rectangle, square, circle, paths), either as fill or stroke (background or border...in other words)
* [Streams](./job-ticket-streams.md) - `stream` flow of content with automatic line wrapping, using the boxes as its limits. Your goto when placing multiline text.

Where makes sense (mostly in case where images or streams are placed) provide also `width` and `height` properties in the box, defining its width and height measures.

## Coordinates system

The default placement coordinates are using a cartesian system by default where an increased horizontal coordination describes an element closer to the page top. read below in "Alternative Positioning" about using screen placement-like coordinates.


## Defining multiple items in the same box

At times it will makes sense to define more than one content elements to a box. For example, if you would like to render a box with text and background color and a border, it may make sense to be able to define a single box and multiple items - one for the background fill shape, one for the text, and one for the border.

In this case don't place one of the 'image', 'text', 'stream' or 'shape' entries. Rather place an 'items' array entry.     
Consider the following example:

```javascript
{
	"bottom":200,
	"left":10,
	"items" : [
		{
			"type":"shape",
			"method":"rectangle",
			"width":200,
			"height":30,
			"options": {
				"type":"stroke",
				"color":"gray"
			}

		},
		{
			"type":"text",
			"text":"text in box",
			"options": {
				"fontSource":"arial",
		                "size":40,
				"color":"yellow"
			}

		}

	]
}
```

The items array contains a shape item, drawing a gray rectangular border, and a text item with "text in box" in yellow.

Note that when defining multiple items using the `items` array, the type of the item is defined by a `type` property matching its object name. For example, for a `text` item, state `text` as type. Following the content types that are available you can choose between `text`, `shape`, `image` and `stream`.

## Alignment

provide an `alignment` property with either `left`, `right` or `center`, to determine the horizontal alignment of the contents inside the box. 

When using [Streams](./job-ticket-streams.md), each line in the box will be aligned on its own (which is what you want, this is only an assurance that this is the case).

By default the alignment is `left`, unless you are using a stream in the box, in which case the stream alignment default will be per its direction definition. If left-to-right, then it will be `left`. If right-to-left, it will be `right`.

## Alternative Positioning

The enging provides alternative methods to static left/bottom placement of boxes. This is to allow convenience to top-bottom placement, as well as dynamic placement.

### Use `top` instead of `bottom`

You can use `top` instead of `bottom` when defining a box vertical positioning. `top` will have the top of the content, and it's bottom will be determined by the box `height` property or, if absent, its content (items).

### Use top of the page as origin for `top` or `bottom`

`bottom` or `top` position can be defined refering to the distance from the page top. To do this add `origin` entry to the box object with the value `pageTop`. In most cases it would go togather with using the `top` property for a box instead of `bottom`.

## Anchor box left top to another box right or bottom

Killer feature time. When creating documents that contain content that you build of the fly, the last thing you want to do is provide exact positioing for that dynamic content. The report engine provides the flexible notion of "anchoring" a box top or left to another box bottom or right corners. This is quite helpful in creating cells of a table, or just any content that comes below or to the right of something that you don't really feel like computing its width or height (or count) in advance.

There are two steps for anchoring:
1. To mark the anchor box with an id. Just add `id` property to a box, where the value is a lable you can use when describing the anchoring object.
2. In the anchoring object relevant property - `left` or `top` - then instead of placing a stating number, provide an object of the form `{box, offset}`, where box value is the aformentioned label, and offset is the measure of distance from the anchor relevant property. Note that negative values for a `top` anchor means down and positive mean `up`. 

As an example, consider the following two boxes definition:

```javascript
{
	"bottom":400,
	"left":10,
	"id":"topBox"
	"shape":
	{
		"method":"rectangle",
		"width":200,
		"height":300,
		"options": {
			"type":"stroke",
			"color":"gray"
		}
	}
},
{
	"top":{"box":"topBox","offset":-20},
	"left":10,
	"shape":
	{
		"method":"rectangle",
		"width":200,
		"height":300,
		"options": {
		"type":"stroke",
		"color":"red"
		}

	}
}
```

The above definition defines a first box at 10,400 and draws a rectangular shape in gray.
Note that this first box has a new "id" property, providing it an ID that other boxes can refer to.

The 2nd box defines a box to have its top using an object which has two properties:

1. `box` - defining an ID for another box. in order case *topBox*. This means that the top of this box should be relative to 400, which is the bottom of *topBox*
2. `offset` - from that 400, take another 20 below that - 380. The `offset` property defines the offset from the top defined by the other box. negative values go lower, higher values go higher.

**Now for something sort of important**
If you are creating multiple rows or columns of boxes, it will make sense to use the same ID over and over again. Note then that it is FINE to provide _the same_ id value for multiple boxes. When doing this you are essentially saying - any boxes that come after this box reusing the id should actually refer to this one, and not the old one. This allows you to use the "lables" as roles and not have to come up with new ones, say if you are building table rows using this method.
