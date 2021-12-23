import { setTimeout } from "timers/promises"; // eslint-disable-line node/no-missing-import
import obs from "../../obs/index.js";

import BaseRedemption from "./base-redemption.js";

import Logger from "../../helpers/logger.js";
const logger = new Logger("💩 Redemption: This Song Is Doo Doo");

class ThisSongIsDooDooRedemption extends BaseRedemption {
  constructor({ streamingService, music }) {
    const title = "ewww this song is doo doo";

    super({ streamingService, title });

    this.data = {
      id: "ef648ac3-fa5d-4065-ae8e-1448d166d5a6",
      title,
      prompt: "skip the song ok",
      cost: 800,
      background_color: "#333333",
      is_global_cooldown_enabled: true,
      global_cooldown_seconds: 60 * 5, // 5 minutes
      isForDancing: true,
    };

    this.fufilledRedemption(async () => {
      const isSpotifyPlaying = await music.isSpotifyPlaying();
      if (isSpotifyPlaying) {
        await this.start();
        await music.clearCurrentTrack();
        await music.spotify.skipTrack();
      }
    });
  }

  async start() {
    logger.log("Triggered...");
    const timeout = 1.5 * 1000;
    obs.turnOnOverlay("Ewan - I Don't Care Video", timeout);
    await setTimeout(timeout);
  }
}

export default ThisSongIsDooDooRedemption;
