const obs = require("../obs");

const detectFaces = require("../helpers/detect-faces");

async function sendFaceDataToClient({ io }) {
  try {
    const image = await obs.getWebcamImage();

    const faceDetection = await detectFaces(image);

    if (!faceDetection) {
      throw new Error("No face detected");
    }

    io.emit("data", { faceDetection });
  } catch (e) {
    // didn't work
  }
}

module.exports = sendFaceDataToClient;
