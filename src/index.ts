const DEFAULT_ACCEPT = ['image', 'image/png', 'image/jpeg', 'image/jpg', 'image/bmp'];
const MB_IN_BYTES = 1024 * 1024;

const TEMP_EL_ID = '__image-loader-tmp-input';


function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = 'none';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  return {canvas, ctx};
}


function createImageInput(changeCallback: (event: Event) => void, accept: string[]) {
  const imageInput = document.createElement('input') as HTMLInputElement;
  imageInput.id = TEMP_EL_ID;
  imageInput.type = 'file';
  imageInput.accept = accept.join(', ');
  imageInput.addEventListener('change', changeCallback);

  imageInput.style.display = 'none';

  document.body.appendChild(imageInput); // otherwise don't work on ios
  return imageInput;
}


function getValidatedImage(dataTransferOrInput: DataTransfer | HTMLInputElement, maxFileSizeMB?: number) {
  if (dataTransferOrInput.files === null) {
    throw new Error('File not chosen!');
  }
  if (dataTransferOrInput.files.length !== 1) {
    throw new Error('Wrong amount of files!');
  }
  const file = dataTransferOrInput.files[0];
  const typeSplitted = file.type.split('/');
  if (typeSplitted.length === 0 || typeSplitted[0] !== 'image') {
    throw new Error('File is not an image!');
  }
  if (maxFileSizeMB && (file.size / MB_IN_BYTES > maxFileSizeMB)) {
    throw new Error('File is bigger than allowed!');
  }

  return file;
}

function cropImage(dataUrl: string, cropToSquare: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!cropToSquare) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.src = dataUrl;
    img.addEventListener('load', () => {
      const imgMinSize = Math.min(img.width, img.height);
      const {canvas, ctx} = createCanvas(imgMinSize, imgMinSize);
      if (!ctx) {
        reject(Error("Unable to create canvas context"));
        return;
      }
      ctx.drawImage(img, (img.width - imgMinSize) / 2, (img.height - imgMinSize) / 2, imgMinSize, imgMinSize, 0, 0, canvas.width, canvas.height);

      const dataURL = canvas.toDataURL();
      canvas.remove();

      resolve(dataURL);
    }, {once: true});
  });
}

function compressImage(dataUrl: string, compressSize?: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!compressSize) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.src = dataUrl;
    img.addEventListener('load', () => {
      const imgMinSize = Math.min(img.width, img.height);

      if (imgMinSize > compressSize) {
        const percents = imgMinSize / compressSize;
        const newWidth = img.width / percents;
        const newHeight = img.height / percents;

        const {canvas, ctx} = createCanvas(newWidth, newHeight);
        if (!ctx) {
          reject(Error("Unable to create canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        const dataURL = canvas.toDataURL();
        canvas.remove();

        resolve(dataURL);
      }
    });
  });
}



function inputImageToDataURL(inputImage: DataTransfer | HTMLInputElement, cropToSquare: boolean, compressSize?: number, maxFileSizeMB?: number) {
  return new Promise((resolve, reject) => {
    let image;
    try {
      image = getValidatedImage(inputImage, maxFileSizeMB);
    } catch (err) {
      reject(err);
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', (e: ProgressEvent<FileReader>) => {
      if (!e.target) {
        reject(new Error('Error while loading file!'))
        return;
      }
      const dataUrl: string = String(e.target.result);

      compressImage(dataUrl, compressSize).then((compressedDataUrl) => {
        cropImage(compressedDataUrl, cropToSquare).then((croppedDataUrl) => {
          resolve(croppedDataUrl);
        }).catch((err) => {throw err;});
      }).catch((err) => {throw err;});
    }, {once: true});
    reader.addEventListener('error', () => {
      reject(new Error('Unable to read file!'));
    });
    reader.readAsDataURL(image);
  });
};


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
  return new Promise((resolve, reject) => {
    createImageInput(async (event) => {
      try {
        const dataUrl = await inputImageToDataURL(event.target as HTMLInputElement, cropToSquare, compressSize, maxFileSizeMB);
        (event.target as HTMLInputElement).remove();
        resolve(dataUrl);
      } catch (err) {
        (event.target as HTMLInputElement).remove();
        reject(err);
      }
    }, acceptExtensions).click();
  });
}


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
  return inputImageToDataURL(dataTransfer, cropToSquare, compressSize, maxFileSizeMB);
}
