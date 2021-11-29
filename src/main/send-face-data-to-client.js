import obs from "../obs/index.js";

import detectFaces from "../helpers/detect-faces.js";

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

export default sendFaceDataToClient;
