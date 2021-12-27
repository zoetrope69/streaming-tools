import { setTimeout } from "timers/promises"; // eslint-disable-line node/no-missing-import
import obs from "../obs/index.js";

import BaseRedemption from "./base-redemption.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("🖨️ Redemption: Text to Print");

class TextToPrintRedemption extends BaseRedemption {
  constructor({ streamingService, raspberryPi }) {
    const title = "TTP (text-to-print)";

    super({ streamingService, title });

    this.streamingService = streamingService;
    this.raspberryPi = raspberryPi;
    this.data = {
      id: "f0ed621b-c66a-482b-9a5d-3af0aa9be656",
      title,
      prompt: "send something to the printer ennet",
      cost: 100,
      background_color: "#FFFFFF",
      should_redemptions_skip_request_queue: false,
      is_global_cooldown_enabled: true,
      global_cooldown_seconds: 60 * 1, // 1 minutes
      is_user_input_required: true,
    };

    this.handleChannelPointRedemptionChatMessage();

    this.unfufilledRedemption((data) => this.start(data));
    this.fufilledRedemption((data) => this.stop(data));
    this.cancelledRedemption((data) => this.stop(data));
  }

  async handleChannelPointRedemptionChatMessage() {
    this.streamingService.chat.on(
      "message",
      ({ id, redemptionId }) => {
        if (redemptionId === this.data.id) {
          this.streamingService.chat.deleteMessage(id);
          return;
        }
      }
    );
  }

  async start(redemption) {
    const { messageWithNoEmotes } = redemption;
    logger.log("Triggered...");

    await obs.showSource({
      scene: "Overlays",
      source: "Printer Cam",
    });

    await this.raspberryPi.printText(messageWithNoEmotes, {
      isBig: true,
    });

    await setTimeout(60 * 1000); // 1 minute later hide

    await obs.hideSource({
      scene: "Overlays",
      source: "Printer Cam",
    });

    try {
      // try and fulfill
      this.streamingService.fulfilRedemptionReward(redemption);
    } catch (e) {
      // do nuthin
    }
  }

  async stop() {
    logger.log("Stopped");

    await obs.hideSource({
      scene: "Overlays",
      source: "Printer Cam",
    });
  }
}

export default TextToPrintRedemption;
