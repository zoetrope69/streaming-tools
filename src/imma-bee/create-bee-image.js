const jimp = require("jimp");
const detectFaces = require("../helpers/detect-faces");
const bufferFromBase64 = require("../helpers/buffer-from-base64");

const { BLEND_MULTIPLY } = jimp;

async function createBeeImage(dataUri) {
  const { buffer: imageBuffer } = bufferFromBase64(dataUri); // TODO might not need this
  const faceDetectionResult = await detectFaces(dataUri);

  if (!faceDetectionResult) {
    throw new Error("No face detected");
  }

  const streamImage = await jimp.read(imageBuffer);
  const beeImage = await jimp.read(__dirname + "/bee.png");
  const circleMaskImage = await jimp.read(
    __dirname + "/circle-mask.png"
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
    __dirname + "/../../client/build/assets/alerts/immabee.png"
  );

  return Promise.resolve();
}

module.exports = createBeeImage;
