import obs from "../obs/index.js";

import BaseRedemption from "./base-redemption.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("🥛 Redemption: Big Drink");

class BigDrinkRedemption extends BaseRedemption {
  constructor({ streamingService, music }) {
    const title = "big drink";

    super({ streamingService, title });

    this.streamingService = streamingService;
    this.music = music;
    this.data = {
      id: "fc929918-95d5-4b79-9697-c4f6d8c36d13",
      title,
      prompt: "it's time to hydrate",
      cost: 50,
      background_color: "#1E92FA",
      should_redemptions_skip_request_queue: false,
      is_global_cooldown_enabled: true,
      global_cooldown_seconds: 60 * 10, // 10 minutes
    };

    this.wasSpotifyPlayingMusic = false;

    this.unfufilledRedemption(async () => {
      this.wasSpotifyPlayingMusic =
        await this.music.isSpotifyPlaying();
      if (this.wasSpotifyPlayingMusic) {
        await this.music.spotify.pauseTrack();
      }
      await this.start();
    });

    const handleFinishedRedemption = async () => {
      await this.stop();
      if (this.wasSpotifyPlayingMusic) {
        await this.music.spotify.playTrack();
        this.wasSpotifyPlayingMusic = false;
      }
    };

    this.fufilledRedemption(handleFinishedRedemption);
    this.cancelledRedemption(handleFinishedRedemption);
  }

  async start() {
    logger.log("Triggered...");
    await obs.showSource({
      scene: "Overlays",
      source: "Amelia Water Loop Music",
    });
    await obs.showSource({
      scene: "Overlays",
      source: "Amelia Water Loop Video",
    });
  }

  async stop() {
    logger.log("Stopped...");
    await obs.hideSource({
      scene: "Overlays",
      source: "Amelia Water Loop Music",
    });
    await obs.hideSource({
      scene: "Overlays",
      source: "Amelia Water Loop Video",
    });

    this.streamingService.chat.sendMessage(
      "shout-out to twitch.tv/ameliabayler the water singer"
    );
  }
}

export default BigDrinkRedemption;
