const fs = require("fs");
const bufferFromBase64 = require("./helpers/buffer-from-base64");

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

module.exports = saveScreenshot;
