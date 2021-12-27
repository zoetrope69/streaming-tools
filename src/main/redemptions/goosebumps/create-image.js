import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import fetch from "node-fetch";
import arrayBufferToBuffer from "arraybuffer-to-buffer";
import jimp from "jimp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { FONT_SANS_16_BLACK, FONT_SANS_16_WHITE } = jimp;

const WIDTH = 339;
const HEIGHT = 500;

const LETTER_WIDTH = 9;
const TEXT_PAD = LETTER_WIDTH * 4.5;
const MAX_TEXT_LENGTH = 55;

async function getFlickrImageURLByKeyword(keyword) {
  const url = `https://loremflickr.com/json/g/${WIDTH}/${HEIGHT}/${encodeURIComponent(
    keyword
  )}/all`;
  const response = await fetch(url);
  const json = await response.json();
  return json.file;
}

async function getImageBuffer(imageURL) {
  const response = await fetch(imageURL);
  const arrayBuffer = await response.arrayBuffer();
  return arrayBufferToBuffer(arrayBuffer);
}

async function getImageFromURL(url) {
  const defaultImageBuffer = await getImageBuffer(url);
  const defaultImage = await jimp.read(defaultImageBuffer);
  return defaultImage;
}

function randomNumberBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// from https://github.com/oliver-moran/jimp/issues/216
function measureText(font, text) {
  let textWidth = 0;

  for (let i = 0; i < text.length; i++) {
    const textCharacter = text[i];
    const textCharacterAfter = text[i];

    const fontCharacter = font.chars[textCharacter];

    if (!fontCharacter) {
      continue;
    }

    textWidth += fontCharacter.xoffset;

    if (
      font.kernings[textCharacter] &&
      font.kernings[textCharacter][textCharacterAfter]
    ) {
      textWidth += font.kernings[text[i]][textCharacterAfter];
    }

    if (fontCharacter.xadvance) {
      textWidth += fontCharacter.xadvance;
    }
  }

  return textWidth;
}

async function createImage(keyword, text) {
  keyword = keyword.toLowerCase();

  if (text.length > MAX_TEXT_LENGTH) {
    text = `${text.substring(0, MAX_TEXT_LENGTH)}...`;
  }
  text = text.toUpperCase();

  const IS_ALT_COVER = randomNumberBetween(0, 1) === 0;

  const loadedImageURL = await getFlickrImageURLByKeyword(keyword);
  const defaultImageURL = `https://loremflickr.com/${WIDTH}/${HEIGHT}/somethingthatwouldnevercomebackwithanything`;

  const coverImagePath = IS_ALT_COVER
    ? "goosebumps-cover-alt.png"
    : "goosebumps-cover.png";

  const fontPath = IS_ALT_COVER
    ? FONT_SANS_16_BLACK
    : FONT_SANS_16_WHITE;

  const textYBuffer = IS_ALT_COVER ? 50 : 47;

  const defaultImage = await getImageFromURL(defaultImageURL);
  const loadedImage = await getImageFromURL(loadedImageURL);
  const goosebumpsImage = await jimp.read(
    fs.readFileSync(
      new URL(path.join("./assets/", coverImagePath), import.meta.url)
    )
  );
  const font = await jimp.loadFont(fontPath);

  const comparisonBetweenImageAndDefaultImage = jimp.distance(
    defaultImage,
    loadedImage
  );
  const isDefaultImage = comparisonBetweenImageAndDefaultImage <= 0.1;

  if (isDefaultImage) {
    throw new Error(
      `No image found for keyword: ${keyword} (${comparisonBetweenImageAndDefaultImage})`
    );
  }
  const huePosition = randomNumberBetween(0, 360);
  const hueRotatedCover = goosebumpsImage.color([
    { apply: "hue", params: [huePosition] },
  ]);

  const mergedImage = loadedImage
    .posterize(6)
    .composite(hueRotatedCover, 0, 0);

  let textXPosition = Math.floor(
    WIDTH / 2 - measureText(font, text) / 2
  );

  const textXPositionTooLow = textXPosition < TEXT_PAD;
  if (textXPositionTooLow) {
    textXPosition = TEXT_PAD;
  }

  const textIsTooLong = text.length > MAX_TEXT_LENGTH;
  if (textIsTooLong) {
    textXPosition += TEXT_PAD;
  }

  const textYPosition = Math.floor(HEIGHT - textYBuffer);

  const textOnImage = mergedImage.print(
    font,
    textXPosition,
    textYPosition,
    text,
    WIDTH - textXPosition
  );

  await textOnImage.writeAsync(
    path.join(
      __dirname,
      "/../../../../client/build/assets/goosebumps/book.jpg"
    )
  );
}

export default createImage;
