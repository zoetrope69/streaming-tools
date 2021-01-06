const cv = require("opencv4nodejs");
const logger = require("../helpers/logger");

const DEBUG = false;

function drawRect(cvImage, rect, color, opts = { thickness: 2 }) {
  return cvImage.drawRectangle(
    rect,
    color,
    opts.thickness,
    cv.LINE_8
  );
}

function drawBlueRect(cvImage, rect, opts = { thickness: 2 }) {
  return drawRect(cvImage, rect, new cv.Vec(255, 0, 0), opts);
}

function outputDebugImage(cvImage, result) {
  // drawn lines for debug
  const thickness = result.confidence < 10 ? 1 : 2;
  drawBlueRect(cvImage, result.rect, { thickness });

  cv.imwriteAsync(
    __dirname + "/debug-face-detection.jpg",
    cvImage,
    (err) => {
      if (err) {
        logger.debug("👽 Detect Face", err);
        return;
      }

      logger.debug("👽 Detect Face", "Saved debug image");
    }
  );
}

function bufferFromBase64(base64text) {
  const base64data = base64text
    .replace("data:image/jpeg;base64", "")
    .replace("data:image/jpg;base64", "")
    .replace("data:image/png;base64", ""); // strip image type prefix

  return Buffer.from(base64data, "base64");
}

async function detectFaces(dataUri) {
  const imageBuffer = bufferFromBase64(dataUri);
  const cvImage = cv.imdecode(imageBuffer);
  const classifier = new cv.CascadeClassifier(
    cv.HAAR_FRONTALFACE_ALT2
  );

  // detect faces
  const {
    objects,
    numDetections: confidences,
  } = classifier.detectMultiScale(cvImage.bgrToGray());

  if (!objects.length) {
    throw new Error("No faces detected!");
  }

  const results = objects
    .map((object, i) => {
      const confidence = confidences[i];
      return { rect: object, confidence };
    })
    .sort((a, b) => b.confidence - a.confidence);

  logger.debug("👽 Detect Face", "Saved debug image");

  const [bestResult] = results;

  if (DEBUG) {
    outputDebugImage(cvImage, bestResult);
  }

  return Promise.resolve(bestResult);
}

module.exports = detectFaces;
