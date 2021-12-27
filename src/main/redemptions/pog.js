import { setTimeout } from "timers/promises"; // eslint-disable-line node/no-missing-import
import obs from "../../obs/index.js";

import BaseRedemption from "./base-redemption.js";

import Logger from "../../helpers/logger.js";
const logger = new Logger("😮 Redemption: Pog");

class PogRedemption extends BaseRedemption {
  constructor({ io, streamingService }) {
    const title = "pog";

    super({ streamingService, title });

    this.io = io;
    this.streamingService = streamingService;
    this.data = {
      id: "8ad56fc6-f597-433c-b388-8e47ba23bc56",
      title,
      prompt:
        "now that, that right there is what we call pog on twitch",
      cost: 100,
      background_color: "#F4FF6B",
      is_global_cooldown_enabled: true,
      global_cooldown_seconds: 60 * 1, // 1 minutes
    };

    this.fufilledRedemption((data) => this.start(data));
  }

  async start() {
    logger.log("Triggered...");
    const timeout = 9 * 1000;
    obs.turnOnOverlay("Steve Pointing Group", timeout);
    await setTimeout(timeout);
    this.streamingService.chat.sendMessage(
      "shout-out to twitch.tv/blgsteve for the pog audit"
    );
  }
}

export default PogRedemption;
