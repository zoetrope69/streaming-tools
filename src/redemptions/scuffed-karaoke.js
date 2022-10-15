import fetch from "node-fetch";

import obs from "../obs/index.js";

import BaseRedemption from "./base-redemption.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("🎤 Redemption: Scuffed Karaoke");

const WEBSITE_BASE_URL = "https://scuffed-karaoke.glitch.me";

class ScuffedKaraokeRedemption extends BaseRedemption {
  constructor({ streamingService }) {
    const title = "scuffed karaoke";

    super({ streamingService, title });

    this.streamingService = streamingService;
    this.data = {
      id: "e3f37f2d-b6fe-4646-b289-577901fb8944",
      title,
      prompt: "type in the name of the song",
      cost: 500,
      background_color: "#FF5D5D",
      should_redemptions_skip_request_queue: false,
      is_global_cooldown_enabled: true,
      global_cooldown_seconds: 60 * 10, // 10 minutes
      is_user_input_required: true,
      is_enabled: false,
    };

    this.redemption = null;

    this.unfufilledRedemption((data) => this.start(data));
    this.fufilledRedemption((data) => this.stop(data));
    this.cancelledRedemption((data) => this.stop(data));

    this.resetSongWebsite();
  }

  async resetSongWebsite() {
    return await obs.updateSourceURL({
      source: "Scuffed Karaoke",
      url: `${WEBSITE_BASE_URL}?random=true`,
    });
  }

  async loadNewSongWebsite(songName) {
    return await obs.updateSourceURL({
      source: "Scuffed Karaoke",
      url: `${WEBSITE_BASE_URL}?name=${songName}`,
    });
  }

  async checkIsSongAvailable(songName) {
    const response = await fetch(
      `${WEBSITE_BASE_URL}/api/song?name=${songName}`
    );
    const json = await response.json();
    return !!json?.url;
  }

  async start(redemption) {
    logger.log("Triggered...");
    this.redemption = redemption;
    const { messageWithNoEmotes: songName, user } = redemption;

    const isSongAvailable = await this.checkIsSongAvailable(songName);

    if (!isSongAvailable) {
      await this.streamingService.chat.sendMessage(
        `@${user.username}, couldn't find a song for "${songName}". refunding u`
      );
      await this.streamingService.cancelRedemptionReward(redemption);
      await this.resetSongWebsite();
      this.redemption = null;
      return;
    }

    await this.loadNewSongWebsite(songName);
    await obs.showSource({
      scene: "Overlays",
      source: "Scuffed Karaoke Group",
    });
  }

  async stop() {
    logger.log("Stopped");

    await obs.hideSource({
      scene: "Overlays",
      source: "Scuffed Karaoke Group",
    });

    if (this.redemption) {
      // if we haven't already fulfilled do it now
      await this.streamingService.cancelRedemptionReward(
        this.redemption
      );
      this.redemption = null;
    }

    await this.resetSongWebsite();
  }
}

export default ScuffedKaraokeRedemption;
