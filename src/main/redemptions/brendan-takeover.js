import obs from "../../obs/index.js";

import BaseRedemption from "./base-redemption.js";

import Logger from "../../helpers/logger.js";
const logger = new Logger("🎮 Redemption: Brendan Takeover");

class BrendanTakeoverRedemption extends BaseRedemption {
  constructor({ io, streamingService }) {
    const title = "brendan takeover";

    super({ streamingService, title });

    this.io = io;
    this.streamingService = streamingService;
    this.data = {
      id: "824b91da-d234-441f-bc55-0b1a148463b5",
      title,
      prompt: "mr fraiser takes over for a bit",
      cost: 200,
      background_color: "#B50028",
      should_redemptions_skip_request_queue: false,
      is_global_cooldown_enabled: true,
      global_cooldown_seconds: 60 * 5, // 5 minutes
    };

    this.unfufilledRedemption(async () => {
      await this.start();

      // maximum of 3 minutes
      setTimeout(async () => {
        await this.stop();
      }, 3 * 60 * 1000);
    });
    this.fufilledRedemption((data) => this.stop(data));
    this.cancelledRedemption((data) => this.stop(data));
  }

  async start() {
    logger.log("Triggered...");

    await obs.showSource({
      scene: "Raw Webcam",
      source: "Brendan On His Switch",
    });
    await obs.hideSource({
      scene: "Raw Webcam",
      source: "Snap Camera (Greenscreen)",
    });
  }

  async stop() {
    logger.log("Stopped...");

    await obs.hideSource({
      scene: "Raw Webcam",
      source: "Brendan On His Switch",
    });
    await obs.showSource({
      scene: "Raw Webcam",
      source: "Snap Camera (Greenscreen)",
    });
  }
}

export default BrendanTakeoverRedemption;
