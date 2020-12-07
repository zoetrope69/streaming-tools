const events = require("events");
const fetch = require("node-fetch");
const hash = require("object-hash");
const { stringify: stringifyQueryString } = require("qs");
const getColors = require("get-image-colors");
const chroma = require("chroma-js");
const cache = require("memory-cache");
const logger = require("./helpers/logger");

const { LAST_FM_API_KEY, LAST_FM_USERNAME } = process.env;

const BASE_URL = `http://ws.audioscrobbler.com/2.0/`;

const CACHE_KEY = "NOW_PLAYING_TRACK";
const CACHE_TIMEOUT_MS = 10000; // 10 secs

async function getAlbumArtColors(albumArtURL) {
  if (!albumArtURL || albumArtURL.length === 0) {
    return;
  }

  const [fileType] = albumArtURL.split(".").reverse();
  const response = await fetch(albumArtURL);
  const imageBuffer = await response.buffer();
  const colors = await getColors(imageBuffer, `image/${fileType}`);

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

async function getLastFmRecentTrack() {
  const queryString = stringifyQueryString({
    api_key: LAST_FM_API_KEY,
    format: "json",
    method: "user.getRecentTracks",
    user: LAST_FM_USERNAME,
    limit: 1,
  });

  const url = `${BASE_URL}?${queryString}`;

  const response = await fetch(url);
  const json = await response.json();

  if (
    !json ||
    !json.recenttracks ||
    !json.recenttracks.track ||
    json.recenttracks.track.length === 0
  ) {
    throw new Error("No track info");
  }

  const [track] = json.recenttracks.track;

  const isNowPlaying =
    track["@attr"] && track["@attr"].nowplaying === "true";

  const artistName = track.artist["#text"];
  const trackName = track.name;
  const albumName = track.album["#text"];
  const albumArt = track.image.find((i) => i.size === "large");
  const albumArtURL = albumArt ? albumArt["#text"] : null;
  const albumArtColors = await getAlbumArtColors(albumArtURL);

  const data = {
    isNowPlaying,
    artistName,
    trackName,
    albumName,
    albumArtURL,
    albumArtColors,
  };

  return {
    id: hash(data),
    ...data,
  };
}

async function emitNowPlayingTrack(eventEmitter) {
  try {
    const track = await getLastFmRecentTrack();

    const CACHED_NOW_PLAYING_TRACK = cache.get(CACHE_KEY);

    // check if we're already have this track in cache
    if (
      track &&
      CACHED_NOW_PLAYING_TRACK &&
      CACHED_NOW_PLAYING_TRACK.id === track.id
    ) {
      return;
    }

    // store in our in memory cache if its now playing
    if (track.isNowPlaying) {
      cache.put(CACHE_KEY, track, CACHE_TIMEOUT_MS);
    }

    eventEmitter.emit("track", track);
  } catch (exception) {
    logger.error("🎸 Last.FM", exception);
  }
}

function lastFm() {
  const eventEmitter = new events.EventEmitter();

  logger.info("🎸 Last.FM", "Checking for new now playing song...");
  // run as soon as we launch script
  // run every 10 seconds after that
  emitNowPlayingTrack(eventEmitter);
  setInterval(() => {
    emitNowPlayingTrack(eventEmitter);
  }, 1000 * 10);

  // again gross, should be returning a class or something
  eventEmitter.getCurrentTrack = () => cache.get(CACHE_KEY);

  return eventEmitter;
}

module.exports = lastFm;
