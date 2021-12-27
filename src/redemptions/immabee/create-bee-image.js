import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

import jimp from "jimp";

import detectFaces from "../../helpers/detect-faces.js";
import bufferFromBase64 from "../../helpers/buffer-from-base64.js";

const { BLEND_MULTIPLY } = jimp;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BEE_IMAGE = fs.readFileSync(
  new URL("./bee.png", import.meta.url)
);
const CIRCLE_MASK_IMAGE = fs.readFileSync(
  new URL("./circle-mask.png", import.meta.url)
);

async function createBeeImage(dataUri) {
  const { buffer: imageBuffer } = bufferFromBase64(dataUri);
  const faceDetectionResult = await detectFaces(dataUri);

  if (!faceDetectionResult) {
    throw new Error("No face detected");
  }

  const streamImage = await jimp.read(imageBuffer);

  const beeImage = await jimp.read(BEE_IMAGE);
  const circleMaskImage = await jimp.read(CIRCLE_MASK_IMAGE);

  const { x, y, width, height } = faceDetectionResult.position;
  streamImage.crop(x, y, width, height);
  streamImage.resize(576, 576);
  streamImage.mask(circleMaskImage, 0, 0);

  beeImage.composite(streamImage, 600, 232, {
    mode: BLEND_MULTIPLY,
    opacitySource: 1,
    opacityDest: 1,
  });

  await beeImage.writeAsync(
    path.join(
      __dirname,
      "/../../../client/build/assets/alerts/immabee.png"
    )
  );

  return Promise.resolve();
}

export default createBeeImage;
