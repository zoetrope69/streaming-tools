const { EventEmitter } = require("events");
const getSpotifyRecentTrack = require("./spotify");
const getLastFmRecentTrack = require("./last-fm");

const logger = require("../helpers/logger");
const { getAlbumArtColors } = require("./helpers");

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
