const { EventEmitter } = require("events");
const getSpotifyRecentTrack = require("./spotify");
const getLastFmRecentTrack = require("./last-fm");

const logger = require("../helpers/logger");
const { getAlbumArtColors } = require("./helpers");

const {
  SPOTIFY_AUTH_REDIRECT_URI,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  LAST_FM_API_KEY,
  LAST_FM_USERNAME,
} = process.env;

function areMusicAPIEnvironmentVariablesAvailable() {
  return (
    SPOTIFY_AUTH_REDIRECT_URI &&
    SPOTIFY_CLIENT_ID &&
    SPOTIFY_CLIENT_SECRET &&
    LAST_FM_API_KEY &&
    LAST_FM_USERNAME
  );
}

async function getCurrentTrack() {
  let track = {};

  try {
    track = await getSpotifyRecentTrack();

    // fallback to lastfm if we cant find spotify
    if (!track) {
      track = await getLastFmRecentTrack();
    }

    if (!track) {
      return;
    }

    if (track.albumArtURL) {
      track.albumArtColors = await getAlbumArtColors(
        track.albumArtURL
      );
    }
  } catch (exception) {
    logger.error("🎸 Music", exception);
  }

  return track;
}

async function emitCurrentTrack(eventEmitter) {
  const track = await getCurrentTrack();
  eventEmitter.emit("track", track);
}

function music() {
  const eventEmitter = new EventEmitter();

  if (!areMusicAPIEnvironmentVariablesAvailable()) {
    eventEmitter.getCurrentTrack = () => null;
    return eventEmitter;
  }

  logger.info("🎸 Music", "Checking for new now playing song...");
  // run as soon as we launch script
  // run every 3 seconds after that
  emitCurrentTrack(eventEmitter);
  setInterval(() => {
    emitCurrentTrack(eventEmitter);
  }, 1000 * 3);

  // again gross, should be returning a class or something
  eventEmitter.getCurrentTrack = getCurrentTrack;

  return eventEmitter;
}

module.exports = music;
