![Static Badge](https://img.shields.io/badge/Vue.js-component-green)
![Static Badge](https://img.shields.io/badge/Common%20js-ES6%20module-green) <br>
![npm](https://img.shields.io/npm/dt/%40sergtyapkin%2Fimage-uploader)

# ES6 lib or Vue.js module "Get image as base64"

### Contents:
> - [ES6 lib interface](#es6-lib-interface)
> - [Vue.js component](#vuejs-component)

# ES6 lib interface:
There are 2 functions. All of them returns gotten image in base64 url encoding:
`import {loadImageInBase64, draggedImageToBase64} from "@sergtyapkin/images-uploader"`

### 1. To get image thorough filesystem dialogue:
```ts
/**
 * Opens user file selection (with filter to images) dialog and returns dataURL of selected image.
 * Image is cropped to the specified size
 *
 * @param cropToSquare is results dataUrl must be a square with size of minimal image side, if null => dataUrl with the size of an original image
 * @param compressSize size to compress the longest side in, if null => dataUrl with the size of an original image
 * @param maxFileSizeMB maximum allowed file size
 * @param acceptExtensions list with allowed mime types
 * @returns Data url of image selected by user
 */
export async function loadImageInBase64(
  cropToSquare: boolean,
  compressSize?: number,
  maxFileSizeMB?: number,
  acceptExtensions: string[] = DEFAULT_ACCEPT,
) {
  // ...
}
```


### 2. To get image thorough drag and drop or any other file loaders
```ts
/**
 * Validate loaded (for example by drag-n-drop) image file and returns dataURL of selected image.
 * Image is cropped to the specified size
 *
 * @param dataTransfer data of all loaded files (you can get in using event.dataTransfer)
 * @param cropToSquare is results dataUrl must be a square with size of minimal image side, if null => dataUrl with the size of an original image
 * @param compressSize size to compress the longest side in, if null => dataUrl with the size of an original image
 * @param maxFileSizeMB maximum allowed file size
 * @returns Data url of image loaded by user
 */
export function draggedImageToBase64 (
  dataTransfer: DataTransfer,
  cropToSquare: boolean = false,
  compressSize?: number,
  maxFileSizeMB?: number,
) {
  // ...
}
```

# Vue.js component:
`import DragNDropLoader from "@sergtyapkin/images-uploader/vue"`

## Usage:
Component has a `<slot>` place inside to insert the elements on which it must works.
Example:
```html
<DragNDropLoader @load="[[loadOutImageToServer]]"
                 @error="alert"
                 :crop-to-square="false"
                 :compress-size="512"
>
  <img class="avatar" :src="[[OurUserAvatarFromVariable]]" alt="avatar">
</DragNDropLoader>
```

## Props:
| name             | type    | required | description                                                                                                                |
|------------------|---------|----------|----------------------------------------------------------------------------------------------------------------------------|
| cropToSquare     | Boolean | yes      | Is results dataUrl must be a square with size of minimal image side, if null => dataUrl with the size of an original image |
| compressSize     | Number  | yes      | Size to compress the longest side in, if null => dataUrl with the size of an original image                                |
| maxAllowedSize   | Number  |          | Maximum allowed file size in MB                                                                                            |
| worksOnClick     | Boolean |          | Is loads image by click                                                                                                    |
| worksOnDragNDrop | Boolean |          | Is loads image by drag and drop into elements inside `<slot>`                                                              |
| disabled         | Boolean |          | Is component disabled (not reacts on user events)                                                                          |

## Events:
| name           | value  | description                                               |
|----------------|--------|-----------------------------------------------------------|
| load           | String | Base64 dataURL of gotten image                            |
| error          | String | Description of error if loading not finished successfully |
