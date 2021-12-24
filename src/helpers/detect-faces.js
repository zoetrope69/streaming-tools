import cv from "opencv4nodejs";
import bufferFromBase64 from "./buffer-from-base64.js";

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
    .map((position, i) => {
      const confidence = confidences[i];
      return { position, confidence };
    })
    .sort((a, b) => b.confidence - a.confidence);

  const [bestResult] = results;

  return bestResult;
}

export default detectFaces;
