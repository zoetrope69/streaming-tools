import BaseRedemption from "./base-redemption.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("🥊 Redemption: Ally Phil");

class AllyPhilRedemption extends BaseRedemption {
  constructor({ streamingService, alerts }) {
    const title = "ally phil";

    super({ streamingService, title });

    this.alerts = alerts;
    this.data = {
      id: "1d8c3308-035b-4466-adae-8cc5726bac26",
      title,
      prompt:
        "if phil removes something that isn't bigotry you will be warned/banned",
      cost: 120,
      background_color: "#052DA5",
      is_user_input_required: true,
    };

    this.fufilledRedemption((data) => this.start(data));
  }

  async start({ message }) {
    logger.log("Triggered...");
    this.alerts.send({
      type: "philpunch",
      message,
      audioUrl: "/assets/alerts/phil-punch.mp3",
      duration: 5000,
      delayAudio: 1000,
    });
  }

  async stop(data) {
    logger.log(data);
  }
}

export default AllyPhilRedemption;
