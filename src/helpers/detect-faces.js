const cv = require("opencv4nodejs");
const bufferFromBase64 = require("./buffer-from-base64");

async function detectFaces(dataUri) {
  const { buffer: imageBuffer } = bufferFromBase64(dataUri);
  const cvImage = cv.imdecode(imageBuffer);
  const classifier = new cv.CascadeClassifier(
    cv.HAAR_FRONTALFACE_ALT2
  );

  // detect faces
  const { objects, numDetections: confidences } =
    classifier.detectMultiScale(cvImage.bgrToGray());

  if (!objects.length) {
    throw new Error("No faces detected!");
  }

  const results = objects
    .map((object, i) => {
      const confidence = confidences[i];
      return { rect: object, confidence };
    })
    .sort((a, b) => b.confidence - a.confidence);

  const [bestResult] = results;

  const { rect, confidence } = bestResult;

  return {
    position: rect,
    confidence,
  };
}

module.exports = detectFaces;
