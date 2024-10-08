const DEFAULT_CROP_SIZE = 256;
const DEFAULT_COMPRESS_SIZE = 256;
const DEFAULT_MAX_FILE_SIZE_MB = 10;
const DEFAULT_ACCEPT = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp'];
const MB_IN_BYTES = 1024 * 1024;

const TEMP_EL_ID = '__image-loader-tmp-input';


function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = 'none';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  return {canvas, ctx};
}


function createImageInput(changeCallback, accept) {
  const imageInput = document.createElement('input') as HTMLInputElement;
  imageInput.id = TEMP_EL_ID;
  imageInput.type = 'file';
  imageInput.accept = accept.join(', ');
  imageInput.addEventListener('change', changeCallback);

  imageInput.style.display = 'none';

  document.body.appendChild(imageInput); // otherwise don't work on ios
  return imageInput;
}


function getValidatedImage(imageInput, maxFileSizeMB) {
  if (imageInput.files.length !== 1) {
    throw new Error('Wrong amount of files!');
  }
  const file = imageInput.files[0];
  const typeSplitted = file.type.split('/');
  if (typeSplitted.length === 0 || typeSplitted[0] !== 'image') {
    throw new Error('File is not an image!');
  }
  if (file.size / MB_IN_BYTES > maxFileSizeMB) {
    throw new Error('File is bigger than allowed!');
  }

  return file;
}

function cropImage(img: HTMLImageElement, cropSize?: number) {
  if (!cropSize) {
    return img;
  }

  const imgMinSize = Math.min(img.width, img.height);

  const {canvas, ctx} = createCanvas(cropSize, cropSize);
  ctx.drawImage(img, 0, 0, imgMinSize, imgMinSize, 0, 0, canvas.width, canvas.height);

  const dataURL = canvas.toDataURL();
  canvas.remove();

  img.src = dataURL;
  img.height = img.width = Math.min(cropSize, imgMinSize);
}

function compressImage(img: HTMLImageElement, compressSize?: number) {
  if (!compressSize) {
    return img;
  }

  const imgMinSize = Math.min(img.width, img.height);
  if (imgMinSize > compressSize) {
    const percents = imgMinSize / compressSize;
    const newWidth = img.width / percents;
    const newHeight = img.height / percents;

    const {canvas, ctx} = createCanvas(newWidth, newHeight);
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    const dataURL = canvas.toDataURL();
    canvas.remove();

    img.width = newWidth;
    img.height = newHeight;
    img.src = dataURL;
  }
}

const inputImageToDataURL = (inputImage, cropSize, compressSize, maxFileSizeMB) => {
  return new Promise((resolve, reject) => {
    let image;
    try {
      image = getValidatedImage(inputImage, maxFileSizeMB);
    } catch (err) {
      inputImage.remove();
      reject(err);
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', (e) => {
      const dataUrl: string = String(e.target.result);

      if (!cropSize && !compressSize) {
        resolve(dataUrl);
        inputImage.remove();
        return;
      }

      const img = new Image();
      img.src = dataUrl;
      img.addEventListener('load', () => {
        cropImage(img);
        compressImage(img);

        resolve(img.src);
        img.remove();
        inputImage.remove();
      }, {once: true});
    }, {once: true});
    reader.addEventListener('error', (e) => {
      reject(new Error('Unable to read file!'));
    });
    reader.readAsDataURL(image);
  });
};


/**
 * Opens user file selection (with filter to images) dialog and returns dataURL of selected image.
 * Image is cropped to the specified size
 *
 * @param cropSize size to fit image in (square size x size), if null => dataUrl with the size of an original image
 * @param compressSize size to compress the longest side in, if null => dataUrl with the size of an original image
 * @param acceptExtensions list with allowed mime types
 * @param maxFileSizeMB maximum allowed file size
 * @returns Data url of image selected by user
 */
export async function loadImageInBase64(
  cropSize: number = DEFAULT_CROP_SIZE,
  compressSize: number = DEFAULT_COMPRESS_SIZE,
  acceptExtensions: string[] = DEFAULT_ACCEPT,
  maxFileSizeMB: number = DEFAULT_MAX_FILE_SIZE_MB,
) {
  createImageInput(async ({target}) => {
    try {
      return inputImageToDataURL(target, cropSize, compressSize, maxFileSizeMB);
    } catch (err) {
      target.remove();
      throw err;
    }
  }, acceptExtensions).click();
}


/**
 * Validate loaded (for example by drag-n-drop) image file and returns dataURL of selected image
 * image is cropped to the specified size
 *
 * @param dataTransfer data of all loaded files (you can get in using event.dataTransfer)
 * @param cropSize size to fit image in (square size x size), if null => dataUrl with the size of an original image
 * @param compressSize size to compress the longest side in, if null => dataUrl with the size of an original image
 * @param maxFileSizeMB maximum allowed file size
 * @returns Data url of image loaded by user
 */
export function draggedImageToBase64 (
  dataTransfer,
  cropSize = DEFAULT_CROP_SIZE,
  compressSize = DEFAULT_COMPRESS_SIZE,
  maxFileSizeMB = DEFAULT_MAX_FILE_SIZE_MB,
) {
  return inputImageToDataURL(dataTransfer, cropSize, compressSize, maxFileSizeMB);
}
