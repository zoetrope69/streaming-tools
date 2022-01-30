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
      prompt:
        "send something to the printer ennet. send just an emote and it'll print that",
      cost: 100,
      background_color: "#FFFFFF",
      should_redemptions_skip_request_queue: false,
      is_global_cooldown_enabled: true,
      global_cooldown_seconds: 60 * 1, // 1 minutes
      is_user_input_required: true,
      is_enabled: false, // only enable when raspberry pi is available
    };

    this.printTimeout = null;
    this.raspberryPiAvailable = false;

    this.enableWhenRaspberryPiAvailable();
    this.handleChannelPointRedemptionChatMessage();

    this.unfufilledRedemption((data) => this.start(data));
    this.fufilledRedemption((data) => this.stop(data));
    this.cancelledRedemption((data) => this.stop(data));
  }

  async enableWhenRaspberryPiAvailable() {
    this.raspberryPi.on("available", () => {
      if (!this.raspberryPiAvailable) {
        this.raspberryPiAvailable = true;
        this.streamingService.enableRedemption(this.data.id);
      }
    });
  }

  async handleChannelPointRedemptionChatMessage() {
    this.streamingService.chat.on(
      "message",
      ({ id, redemptionId, messageWithNoEmotes, emoteImages }) => {
        if (redemptionId === this.data.id) {
          this.handleMessage({
            id,
            messageWithNoEmotes,
            emoteImages,
          });

          return;
        }
      }
    );
  }

  async handleMessage({ id, messageWithNoEmotes, emoteImages }) {
    await obs.showSource({
      scene: "Overlays",
      source: "Printer Cam",
    });

    const isEmoteMode =
      messageWithNoEmotes.length === 0 && emoteImages.length > 0;
    if (isEmoteMode) {
      let [emoteImage] = emoteImages;

      /*
        get static version of animated emotes
        always get light mode emotes
      */
      emoteImage = emoteImage
        .replace("/default/", "/static/")
        .replace("/dark/", "/light/");

      await this.raspberryPi.printEmote({ emoteImage });
    } else {
      await this.raspberryPi.printText(messageWithNoEmotes, {
        isBig: true,
        lineFeed: {
          after: 10,
        },
      });
    }

    this.streamingService.chat.deleteMessage(id);
  }

  async start(redemption) {
    logger.log("Triggered...");

    if (this.printTimeout) {
      clearTimeout(this.printTimeout);
    }

    await obs.showSource({
      scene: "Overlays",
      source: "Printer Cam",
    });

    const timeout = 60 * 1000; // 1 minute later hide

    setTimeout(async () => {
      await this.streamingService.fulfilRedemptionReward(redemption);
    }, timeout);

    this.printTimeout = setTimeout(async () => {
      await obs.hideSource({
        scene: "Overlays",
        source: "Printer Cam",
      });
      this.printTimeout = null;
    }, timeout);
  }

  async stop() {
    logger.log("Stopped");

    if (this.printTimeout) {
      clearTimeout(this.printTimeout);
      this.printTimeout = null;
    }

    await obs.hideSource({
      scene: "Overlays",
      source: "Printer Cam",
    });
  }
}

export default TextToPrintRedemption;
