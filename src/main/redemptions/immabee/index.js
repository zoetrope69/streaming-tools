import obs from "../../../obs/index.js";
import createBeeImage from "./create-bee-image.js";

import BaseRedemption from "../base-redemption.js";

import Logger from "../../../helpers/logger.js";
const logger = new Logger("🐝 Redemption: Imma Bee");

class ImmaBeeRedemption extends BaseRedemption {
  constructor({ io, streamingService, alerts }) {
    const title = "imma bee";

    super({ streamingService, title });

    this.io = io;
    this.streamingService = streamingService;
    this.alerts = alerts;
    this.data = {
      id: "975f6903-f026-4112-988a-a13d03a78049",
      title,
      prompt: "imma bee imma bee imma bee imma bee imma bee imma bee",
      cost: 300,
      background_color: "#FFF400",
      should_redemptions_skip_request_queue: false,
    };

    this.unfufilledRedemption((data) => this.start(data));
  }

  async start(redemption) {
    logger.log("Triggered...");

    try {
      const image = await obs.getWebcamImage();
      await createBeeImage(image);
      this.alerts.send({ type: "immabee" });
      this.streamingService.fulfilRedemptionReward(redemption);
    } catch (e) {
      logger.error(JSON.stringify(e));
      this.streamingService.chat.sendMessage(
        `Couldn't find Zac's face...`
      );
      this.streamingService.cancelRedemptionReward(redemption);
    }
  }
}

export default ImmaBeeRedemption;
