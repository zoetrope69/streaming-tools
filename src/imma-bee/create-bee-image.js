import path from "path";
import jimp from "jimp";

import detectFaces from "../helpers/detect-faces.js";
import bufferFromBase64 from "../helpers/buffer-from-base64.js";

const { BLEND_MULTIPLY } = jimp;

async function createBeeImage(dataUri) {
  const { buffer: imageBuffer } = bufferFromBase64(dataUri); // TODO might not need this
  const faceDetectionResult = await detectFaces(dataUri);

  if (!faceDetectionResult) {
    throw new Error("No face detected");
  }

  const streamImage = await jimp.read(imageBuffer);
  const beeImage = await jimp.read(path.join(__dirname, "/bee.png"));
  const circleMaskImage = await jimp.read(
    path.join(__dirname, "/circle-mask.png")
  );

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
      "/../../client/build/assets/alerts/immabee.png"
    )
  );

  return Promise.resolve();
}

export default createBeeImage;
