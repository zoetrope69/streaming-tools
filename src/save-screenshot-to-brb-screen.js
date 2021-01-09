const fs = require("fs");

async function saveScreenshot(image) {
  const base64Data = image.replace("data:image/jpg;base64,", "");
  return new Promise((resolve, reject) => {
    fs.writeFile(
      "/mnt/c/Users/Zac/Documents/Streaming/brb-image.jpg",
      base64Data,
      "base64",
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
