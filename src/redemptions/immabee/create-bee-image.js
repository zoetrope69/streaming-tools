import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

import jimp from "jimp";

import randomNumber from "../../helpers/random-number.js";
import detectFaces from "../../helpers/detect-faces.js";
import bufferFromBase64 from "../../helpers/buffer-from-base64.js";

const { BLEND_HARDLIGHT } = jimp;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const IMAGE_BEE_BASE = fs.readFileSync(
  new URL("./assets/bee-base.png", import.meta.url)
);
const IMAGE_BEE_WINGS = fs.readFileSync(
  new URL("./assets/bee-wings.png", import.meta.url)
);
const IMAGE_BEE_TIE = fs.readFileSync(
  new URL("./assets/bee-tie.png", import.meta.url)
);
const IMAGE_BEE_HORNS = fs.readFileSync(
  new URL("./assets/bee-horns.png", import.meta.url)
);
const IMAGE_BEE_BOW = fs.readFileSync(
  new URL("./assets/bee-bow.png", import.meta.url)
);
const IMAGE_BEE_HAT = fs.readFileSync(
  new URL("./assets/bee-hat.png", import.meta.url)
);
const IMAGE_FACE_MASK = fs.readFileSync(
  new URL("./assets/face-mask.png", import.meta.url)
);

async function getCroppedMaskedFaceImage(image, faceDetectionResult) {
  const { x, y, width, height } = faceDetectionResult.position;
  const faceMaskImage = await jimp.read(IMAGE_FACE_MASK);

  const xPadding = 20;
  const yPadding = 15;
  const newWidth = width - xPadding * 2;
  const newHeight = height - yPadding * 2;
  if (newWidth > 0 && newHeight > 0) {
    image.crop(x + xPadding, y + yPadding, newWidth, newHeight);
  }
  image.resize(443, 486);
  image.mask(faceMaskImage, 0, 0);

  return image;
}

function getHueRotateValue(isDevil) {
  if (isDevil) {
    return -50;
  }

  if (randomNumber(0, 100) > 70) {
    return randomNumber(0, 360);
  }

  return 0;
}

async function compositeFaceOntoBee(croppedMaskedFaceImage, isDevil) {
  const baseBeeImage = await jimp.read(IMAGE_BEE_BASE);

  const randomColourBaseBeeImage = await hueRotateImage(
    baseBeeImage,
    getHueRotateValue(isDevil)
  );

  randomColourBaseBeeImage.composite(
    croppedMaskedFaceImage,
    384,
    92,
    {
      mode: BLEND_HARDLIGHT,
      opacitySource: 1,
      opacityDest: 1,
    }
  );

  return randomColourBaseBeeImage;
}

async function hueRotateImage(image, value) {
  image.color([{ apply: "hue", params: [value] }]);
  return image;
}

async function addImage(image, imageToAddPath) {
  let imageToAdd = await jimp.read(imageToAddPath);

  image.composite(imageToAdd, 0, 0);

  return image;
}

async function createBeeImage(dataUri) {
  const { buffer: imageBuffer } = bufferFromBase64(dataUri);
  const faceDetectionResult = await detectFaces(dataUri);

  if (!faceDetectionResult) {
    throw new Error("No face detected");
  }

  const isDevil = randomNumber(0, 100) > 90;

  let image = await jimp.read(imageBuffer);
  image = await getCroppedMaskedFaceImage(image, faceDetectionResult);
  image = await compositeFaceOntoBee(image, isDevil);
  image = await addImage(image, IMAGE_BEE_WINGS);

  if (isDevil) {
    image = await addImage(image, IMAGE_BEE_HORNS);
  } else if (randomNumber(0, 100) > 80) {
    image = await addImage(image, IMAGE_BEE_TIE);
  } else if (randomNumber(0, 100) > 81) {
    image = await addImage(image, IMAGE_BEE_BOW);
  } else if (randomNumber(0, 100) > 82) {
    image = await addImage(image, IMAGE_BEE_HAT);
  }

  await image.writeAsync(
    path.join(
      __dirname,
      "/../../../client/build/assets/alerts/immabee.png"
    )
  );

  return Promise.resolve();
}

export default createBeeImage;
