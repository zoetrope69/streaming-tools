import BaseRedemption from "./base-redemption.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("🎶 Redemption: Change Ableton Tempo");

class ChangeAbletonTempoRedemption extends BaseRedemption {
  constructor({ streamingService, ableton }) {
    const title = "change BPM";

    super({ streamingService, title });

    this.ableton = ableton;
    this.streamingService = streamingService;
    this.data = {
      id: "f75de1c8-5765-4358-a3f9-50d85ae366bb",
      title,
      prompt:
        "change the ableton song BPM (number between 20 and 1000)",
      cost: 1,
      background_color: "#ffffff",
      should_redemptions_skip_request_queue: false,
      is_user_input_required: true,
      is_enabled: false, // disabled on boot
    };

    if (this.ableton.isConnected) {
      this.streamingService.enableRedemption(this.data.id);
    } else {
      this.streamingService.disableRedemption(this.data.id);
    }
    this.ableton.on("isConnected", (isConnected) => {
      if (isConnected) {
        this.streamingService.enableRedemption(this.data.id);
      } else {
        this.streamingService.disableRedemption(this.data.id);
      }
    });

    this.unfufilledRedemption((data) => this.start(data));
  }

  async start(redemption) {
    logger.log("Triggered...");
    logger.log(redemption);

    try {
      await this.ableton.setTempo(redemption.message);
    } catch (e) {
      await this.streamingService.chat.sendMessage(
        `@${redemption.user.username}, ${e.message}. refunding u`
      );
      await this.streamingService.cancelRedemptionReward(redemption);
      return;
    }

    await this.streamingService.fulfilRedemptionReward(redemption);
  }
}

export default ChangeAbletonTempoRedemption;
