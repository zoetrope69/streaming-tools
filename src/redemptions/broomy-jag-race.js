import obs from "../obs/index.js";

import BaseRedemption from "./base-redemption.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("🚗 Redemption: BroomyJagRace");

class BroomyJagRaceRedemption extends BaseRedemption {
  constructor({ streamingService, music }) {
    const title = "BroomyJagRace";

    super({ streamingService, title });

    this.music = music;
    this.data = {
      id: "243c560a-fabe-413b-b47c-bcf9deb0dbd1",
      title,
      prompt: "start your broomers",
      cost: 800,
      background_color: "#FFFFFF",
      should_redemptions_skip_request_queue: false,
      is_global_cooldown_enabled: true,
      global_cooldown_seconds: 60 * 5, // 5 minutes
    };

    this.wasSpotifyPlayingMusic = false;

    this.unfufilledRedemption((data) => this.start(data));
    this.fufilledRedemption((data) => this.stop(data));
    this.cancelledRedemption((data) => this.stop(data));
  }

  async start() {
    logger.log("Triggered...");

    this.wasSpotifyPlayingMusic = await this.music.isSpotifyPlaying();
    if (this.wasSpotifyPlayingMusic) {
      await this.music.spotify.pauseTrack();
    }

    await obs.showSource({
      scene: "Overlays",
      source: "BroomyJagRace",
    });
  }

  async stop() {
    logger.log("Stopped...");

    await obs.hideSource({
      scene: "Overlays",
      source: "BroomyJagRace",
    });

    if (this.wasSpotifyPlayingMusic) {
      await this.music.spotify.playTrack();
    }
  }
}

export default BroomyJagRaceRedemption;
