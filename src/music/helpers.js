const fetch = require("node-fetch");
const getColors = require("get-image-colors");
const chroma = require("chroma-js");
const imageType = require("image-type");
const cache = require("memory-cache");

const CACHE_KEY = "MUSIC";

async function getAlbumArtColors(albumArtURL) {
  if (!albumArtURL || albumArtURL.length === 0) {
    return;
  }

  const response = await fetch(albumArtURL);
  const imageBuffer = await response.buffer();
  const { mime } = imageType(imageBuffer);

  const colors = await getColors(imageBuffer, mime);

  // sort by luminance, get contrast of top and bototm if they pass a value use them
  // try contrast for black on brightest
  // try white on darkest
  const sortedColors = colors.sort((a, b) => {
    return a.luminance() > b.luminance() ? -1 : 1;
  });

  const brightestColor = sortedColors[0].css("rgb");
  const darkestColor = sortedColors.pop().css("rgb");

  if (chroma.contrast(brightestColor, darkestColor) > 7) {
    return { brightestColor, darkestColor };
  }

  // black text on brighest colour
  if (chroma.contrast(brightestColor, "#111") > 7) {
    return { brightestColor, darkestColor: "#111" };
  }

  // white text on darkest colour
  if (chroma.contrast(darkestColor, "#fff") > 7) {
    return { brightestColor: "#fff", darkestColor };
  }

  return;
}

async function getCachedAlbumArtColors(albumArtURL) {
  const cacheKey = `${CACHE_KEY}-${albumArtURL}`;
  const cachedAlbumArtColors = cache.get(cacheKey);

  if (cachedAlbumArtColors) {
    return cachedAlbumArtColors;
  }

  const albumArtColors = await getAlbumArtColors(albumArtURL);

  cache.put(cacheKey, albumArtColors, 1000 * 60 * 10); // 10 minutes

  return albumArtColors;
}

module.exports = {
  getAlbumArtColors: getCachedAlbumArtColors,
};
