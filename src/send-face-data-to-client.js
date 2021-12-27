import obs from "./obs/index.js";

import detectFaces from "./helpers/detect-faces.js";

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

function getScaledPosition(position) {
  const { xScale, yScale } = getScale();
  return {
    width: position.width * xScale,
    height: position.height * yScale,
    x: position.x * xScale,
    y: position.y * yScale,
  };
}

async function sendFaceDataToClient({ io }) {
  try {
    const image = await obs.getWebcamImage();

    const faceDetection = await detectFaces(image);

    if (!faceDetection) {
      throw new Error("No face detected");
    }

    const position = getScaledPosition(faceDetection.position);

    const newFaceDetection = {
      ...faceDetection,
      position,
    };

    io.emit("data", { faceDetection: newFaceDetection });
  } catch (e) {
    // didn't work
  }
}

export default sendFaceDataToClient;
