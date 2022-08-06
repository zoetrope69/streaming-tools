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

class Music extends EventEmitter {
  constructor({ ableton }) {
    super();

    this.ableton = ableton;

    this.emitCurrentTrackOverTime();
  }

  async getRecentAbletonTrack() {
    const { isConnected, isPlaying, tempo } = this.ableton;

    if (!isConnected || !isPlaying) {
      return;
    }

    return {
      isNowPlaying: true,
      id: "ableton",
      artistName: "zactopus",
      trackName: "Ableton",
      albumArtURL: "/assets/ableton-logo.svg",
      albumArtColors: {
        darkestColor: "white",
        brightestColor: "black",
      },
      beatsPerMillisecond: 60000 / tempo,
    };
  }

  async getCurrentTrackNoAlbumArtColors() {
    const abletonTrack = await this.getRecentAbletonTrack();
    if (abletonTrack) {
      return abletonTrack;
    }

    const spotifyTrack = await getRecentSpotifyTrack();
    if (spotifyTrack && spotifyTrack.isNowPlaying) {
      return spotifyTrack;
    }

    const lastFmTrack = await getRecentLastFmTrack();
    if (lastFmTrack) {
      return lastFmTrack;
    }
  }

  async getCurrentTrack() {
    try {
      const track = await this.getCurrentTrackNoAlbumArtColors();

      if (track.albumArtURL && !track.albumArtColors) {
        track.albumArtColors = await getAlbumArtColors(
          track.albumArtURL
        );
      }

      return track;
    } catch (e) {
      logger.error(e.message);
      return {};
    }
  }

  async isSpotifyPlaying() {
    const track = await getRecentSpotifyTrack();
    return track && track.isNowPlaying;
  }

  async emitCurrentTrack() {
    const track = await this.getCurrentTrack();

    this.emit("track", track);
  }

  async emitCurrentTrackOverTime() {
    logger.info("Checking for new now playing song...");
    // run as soon as we launch script
    // run every 3 seconds after that
    this.emitCurrentTrack();
    setInterval(() => this.emitCurrentTrack(), 1000 * 3);
  }

  async clearCurrentTrack() {
    this.emit("track", {});
  }

  get spotify() {
    return {
      getRecentTrack: getRecentSpotifyTrack,
      pauseTrack: async () => {
        await pauseTrack();
        await this.clearCurrentTrack();
      },
      playTrack: async () => {
        await playTrack();
        await this.emitCurrentTrack();
      },
      skipTrack: async () => {
        await skipTrack();
        await this.emitCurrentTrack();
      },
    };
  }

  get lastFm() {
    return {
      getRecentTrack: getRecentLastFmTrack,
    };
  }
}

export default Music;
