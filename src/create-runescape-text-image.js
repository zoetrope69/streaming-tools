import fs from "fs";

import getRuneScapeTextImage from "runescape-text";

function truncate(text, amount = 100) {
  if (!text || text.length === 0) {
    return "";
  }

  if (text.length < amount) {
    return text;
  }

  return `${text.substring(0, amount)}...`;
}

const FILE_PATH_BASE = "../client/build/assets/alerts/runescape-text";

function deleteFileIfExists(filePath) {
  const exists = fs.existsSync(new URL(filePath, import.meta.url));
  if (exists) {
    fs.unlinkSync(new URL(filePath, import.meta.url));
  }
}

function removeEmotes(text) {
  const textTokens = text.split(" ");

  const newTokens = textTokens.map((textToken) => {
    const isEmote =
      textToken.startsWith(":") && textToken.endsWith(":");
    if (isEmote) {
      return "";
    }

    return textToken;
  });

  return newTokens.join(" ").trim();
}

function getTextWithoutOptions(text) {
  const [firstArg, ...restOfArgs] = text.split(" ");

  if (firstArg.includes(":")) {
    return restOfArgs.join(" ");
  }

  return text;
}

async function createRunescapeTextImage(message) {
  const text = truncate(removeEmotes(message), 130);
  const messageWithoutOptions = getTextWithoutOptions(text);

  const options = {
    scale: 4,
  };
  const wordWrapOptions = {
    width: 25,
    trim: true,
  };

  let runescapeTextResult = null;
  try {
    runescapeTextResult = getRuneScapeTextImage(
      text,
      options,
      wordWrapOptions
    );
  } catch (e) {
    // sometimes the text parser can explode
    // ...
  }

  if (!runescapeTextResult) {
    return null;
  }

  const { extension, buffer } = runescapeTextResult;

  // delete old files if they exist
  deleteFileIfExists(`${FILE_PATH_BASE}.gif`);
  deleteFileIfExists(`${FILE_PATH_BASE}.png`);

  // save new file
  fs.writeFileSync(
    new URL(`${FILE_PATH_BASE}.${extension}`, import.meta.url),
    await buffer
  );

  return { messageWithoutOptions };
}

export default createRunescapeTextImage;
