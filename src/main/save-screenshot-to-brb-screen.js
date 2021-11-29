import fs from "fs";
import bufferFromBase64 from "../helpers/buffer-from-base64.js";

async function saveScreenshot(dataUri) {
  const { buffer: imageBuffer, contentType } =
    bufferFromBase64(dataUri);
  return new Promise((resolve, reject) => {
    fs.writeFile(
      `/mnt/c/Users/Zac/Documents/Streaming/brb-image.${contentType}`,
      imageBuffer,
      (err) => {
        if (err) {
          return reject(err);
        }

        resolve();
      }
    );
  });
}

export default saveScreenshot;
