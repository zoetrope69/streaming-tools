const fs = require("fs");
const vision = require("@google-cloud/vision");

const bufferFromBase64 = require("./buffer-from-base64");

const client = new vision.ImageAnnotatorClient();

async function saveBase64Image(base64) {
  const { buffer, contentType } = bufferFromBase64(base64);
  const imagePath = `temp-face-image.${contentType}`;
  fs.writeFileSync(imagePath, buffer);
  return imagePath;
}

async function detectFaces(base64) {
  const imagePath = await saveBase64Image(base64);

  const [faceDetectionResult] = await client.faceDetection(imagePath);

  if (
    !faceDetectionResult ||
    faceDetectionResult.faceAnnotations.length === 0
  ) {
    throw new Error("No faces detected!");
  }

  const [face] = faceDetectionResult.faceAnnotations.sort(
    (a, b) => b.detectionConfidence - a.detectionConfidence
  );

  if (face.detectionConfidence < 0.2) {
    throw new Error("No faces detected!");
  }

  // boundingPoly - full head
  // fdBoundingPoly - just face
  const { vertices } = face.fdBoundingPoly;
  /*
    [
      { x: 64,  y: 77  },  top left
      { x: 240, y: 77  },  top right
      { x: 240, y: 262 },  bottom right
      { x: 64,  y: 262 }   bottom left
    ]
  */

  const xYPositions = vertices[0];
  const bottomRightXyPositions = vertices[2];

  const { x, y } = xYPositions;
  const width = bottomRightXyPositions.x - x;
  const height = bottomRightXyPositions.y - y;

  return {
    position: {
      x,
      y,
      width,
      height,
    },
    confidence: face.detectionConfidence,
  };
}

module.exports = detectFaces;
