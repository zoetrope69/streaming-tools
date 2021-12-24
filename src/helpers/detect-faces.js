import cv from "opencv4nodejs";
import bufferFromBase64 from "./buffer-from-base64.js";

const {
  CLIENT_WIDTH,
  CLIENT_HEIGHT,
  OBS_RESOLUTION_WIDTH,
  OBS_RESOLUTION_HEIGHT,
} = process.env;

function getScale() {
  const xScale = CLIENT_WIDTH / OBS_RESOLUTION_WIDTH;
  const yScale = CLIENT_HEIGHT / OBS_RESOLUTION_HEIGHT;
  return { xScale, yScale };
}

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

  const { xScale, yScale } = getScale();
  const results = objects
    .map((object, i) => {
      const confidence = confidences[i];
      const position = {
        width: object.width * xScale,
        height: object.height * yScale,
        x: object.x * xScale,
        y: object.y * yScale,
      };
      return { position, confidence };
    })
    .sort((a, b) => b.confidence - a.confidence);

  const [bestResult] = results;

  return bestResult;
}

export default detectFaces;
