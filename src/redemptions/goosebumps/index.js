import obs from "../../obs/index.js";

import createGoosebumpsBookImage from "./create-goosebumps-book.js";

import BaseRedemption from "../base-redemption.js";

import Logger from "../../helpers/logger.js";
const logger = new Logger("📚 Redemption: Goosebumps Book");

class GoosebumpsRedemption extends BaseRedemption {
  constructor({ io, streamingService, music }) {
    const title = "goosebumpz book";

    super({ streamingService, title });

    this.io = io;
    this.streamingService = streamingService;
    this.music = music;
    this.data = {
      id: "6b8cc18a-f927-41fd-9dbf-aca27fd1f0ec",
      title,
      prompt: "only put in one or two words. e.g carrot cake",
      cost: 100,
      background_color: "#00C7AC",
      should_redemptions_skip_request_queue: false,
      is_user_input_required: true,
    };

    this.redemption = null;
    this.bookTitle = null;
    this.wasSpotifyPlayingMusic = false;
    this.previousSceneName = null;

    this.unfufilledRedemption((data) => this.start(data));
    this.fufilledRedemption((data) => this.stop(data));
    this.cancelledRedemption((data) => this.stop(data));
  }

  async start(redemption) {
    this.redemption = redemption;
    const { message } = this.redemption;
    logger.log("Triggered...");

    try {
      const { bookTitle } = await createGoosebumpsBookImage(message);

      const { name } = await obs.getCurrentScene();
      this.previousSceneName = name;

      this.wasSpotifyPlayingMusic =
        await this.music.isSpotifyPlaying();
      if (this.wasSpotifyPlayingMusic) {
        await this.music.spotify.pauseTrack();
      }

      this.io.emit("data", { goosebumpsBookTitle: bookTitle });

      this.bookTitle = bookTitle;

      await obs.switchToScene("Goosebumps");
    } catch (e) {
      logger.error(e.message || e);

      this.streamingService.chat.sendMessage(
        `Couldn't generate a book for ${message}`
      );

      if (this.redemption) {
        this.streamingService.cancelRedemptionReward(this.redemption);
      }
    }
  }

  async stop() {
    logger.log("Stopped");

    this.io.emit("data", { goosebumpsBookTitle: null });

    await obs.switchToScene(
      this.previousSceneName || "Main Bigger Zac"
    );

    if (this.wasSpotifyPlayingMusic) {
      await this.music.spotify.playTrack();
    }

    this.bookTitle = null;
    this.previousSceneName = null;
    this.redemption = null;
    this.wasSpotifyPlayingMusic = false;
  }
}

export default GoosebumpsRedemption;
