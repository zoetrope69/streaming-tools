import { EventEmitter } from "events";
import {
  getRecentSpotifyTrack,
  pauseTrack,
  playTrack,
  skipTrack,
} from "./spotify.js";
import { getRecentLastFmTrack } from "./last-fm.js";

import Logger from "../helpers/logger.js";
import { getCachedAlbumArtColors as getAlbumArtColors } from "./helpers.js";

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
    track = await getRecentSpotifyTrack();

    // fallback to lastfm if we cant find spotify
    if (!track || !track.isNowPlaying) {
      track = await getRecentLastFmTrack();
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

async function isSpotifyPlaying() {
  const track = await getRecentSpotifyTrack();
  return track && track.isNowPlaying;
}

function Music() {
  const eventEmitter = new EventEmitter();

  async function emitCurrentTrack() {
    const track = await getCurrentTrack();
    eventEmitter.emit("track", track);
  }

  async function clearCurrentTrack() {
    eventEmitter.emit("track", {});
  }

  if (!areMusicAPIEnvironmentVariablesAvailable()) {
    eventEmitter.getCurrentTrack = () => null;
    return eventEmitter;
  }

  logger.info("Checking for new now playing song...");
  // run as soon as we launch script
  // run every 3 seconds after that
  emitCurrentTrack();
  setInterval(emitCurrentTrack, 1000 * 3);

  return Object.assign(eventEmitter, {
    clearCurrentTrack,
    isSpotifyPlaying,
    spotify: {
      getRecentTrack: getRecentSpotifyTrack,
      pauseTrack: async () => {
        await pauseTrack();
        await clearCurrentTrack();
      },
      playTrack: async () => {
        await playTrack();
        await emitCurrentTrack();
      },
      skipTrack: async () => {
        await skipTrack();
        await emitCurrentTrack();
      },
    },
    lastFm: {
      getRecentTrack: getRecentLastFmTrack,
    },
    getCurrentTrack,
  });
}

export default Music;
