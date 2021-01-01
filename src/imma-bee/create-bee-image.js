const jimp = require("jimp");
const detectFaces = require("./detect-faces");

function bufferFromBase64(base64text) {
  const base64data = base64text
    .replace("data:image/jpeg;base64", "")
    .replace("data:image/jpg;base64", "")
    .replace("data:image/png;base64", ""); // strip image type prefix

  return Buffer.from(base64data, "base64");
}

async function createBeeImage(dataUri) {
  const imageBuffer = bufferFromBase64(dataUri); // TODO might not need this
  const faceDetectionResult = await detectFaces(dataUri);

  if (!faceDetectionResult) {
    throw new Error("No face detected");
  }

  const streamImage = await jimp.read(imageBuffer);
  const beeImage = await jimp.read(__dirname + "/bee.png");
  const circleMaskImage = await jimp.read(
    __dirname + "/circle-mask.png"
  );

  const { x, y, width, height } = faceDetectionResult.rect;
  streamImage.crop(x, y, width, height);
  streamImage.resize(576, jimp.AUTO);
  streamImage.mask(circleMaskImage, 0, 0);

  beeImage.composite(streamImage, 600, 232, {
    mode: jimp.BLEND_MULTIPLY,
    opacitySource: 1,
    opacityDest: 1,
  });

  await beeImage.writeAsync(
    __dirname + "/../../client/build/immabee.png"
  );

  return Promise.resolve();
}

module.exports = createBeeImage;
