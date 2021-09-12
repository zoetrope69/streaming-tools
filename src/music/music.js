const { EventEmitter } = require("events");
const spotify = require("./spotify");
const lastFm = require("./last-fm");

const Logger = require("../helpers/logger");
const { getAlbumArtColors } = require("./helpers");

const logger = new Logger("🎸 Music");

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
    track = await spotify.getRecentTrack();

    // fallback to lastfm if we cant find spotify
    if (!track) {
      logger.debug(`Couldn't get track from Spotify. Using Last.fm`);
      track = await lastFm.getRecentTrack();
    }

    if (!track) {
      return;
    }

    if (track.albumArtURL) {
      track.albumArtColors = await getAlbumArtColors(
        track.albumArtURL
      );
    }
  } catch (e) {
    logger.error(e.message);
  }

  return track;
}

async function emitCurrentTrack(eventEmitter) {
  const track = await getCurrentTrack();
  eventEmitter.emit("track", track);
}

async function isSpotifyPlaying() {
  const track = await spotify.getRecentTrack();
  return track && track.isNowPlaying;
}

function music() {
  const eventEmitter = new EventEmitter();

  if (!areMusicAPIEnvironmentVariablesAvailable()) {
    eventEmitter.getCurrentTrack = () => null;
    return eventEmitter;
  }

  logger.info("Checking for new now playing song...");
  // run as soon as we launch script
  // run every 3 seconds after that
  emitCurrentTrack(eventEmitter);
  setInterval(() => {
    emitCurrentTrack(eventEmitter);
  }, 1000 * 3);

  return Object.assign(eventEmitter, {
    isSpotifyPlaying,
    spotify,
    lastFm,
    getCurrentTrack,
  });
}

module.exports = music;
