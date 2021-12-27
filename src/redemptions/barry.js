import { setTimeout } from "timers/promises"; // eslint-disable-line node/no-missing-import
import obs from "../obs/index.js";

import BaseRedemption from "./base-redemption.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("🧔‍♂️ Redemption: Barry");

class BarryRedemption extends BaseRedemption {
  constructor({ streamingService, music }) {
    const title = "barry";

    super({ streamingService, title });

    this.music = music;

    this.data = {
      id: "51411177-c629-48da-90da-1ecf9046e760",
      title,
      cost: 1111,
      background_color: "#05B33E",
      is_global_cooldown_enabled: true,
      global_cooldown_seconds: 60 * 5, // 5 minutes
      is_enabled: false, // temporarily disabled
    };

    this.wasSpotifyPlayingMusic = false;

    this.fufilledRedemption((data) => this.start(data));
  }

  async start() {
    logger.log("Triggered...");

    this.wasSpotifyPlayingMusic = await this.music.isSpotifyPlaying();

    if (this.wasSpotifyPlayingMusic) {
      await this.music.spotify.pauseTrack();
    }

    const timeout = 104 * 1000;
    obs.turnOnOverlay("Barry Singing", timeout);
    await setTimeout(timeout);

    if (this.wasSpotifyPlayingMusic) {
      await this.music.spotify.playTrack();
    }
  }
}

export default BarryRedemption;
