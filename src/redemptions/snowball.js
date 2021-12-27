import BaseRedemption from "./base-redemption.js";

import sendFaceDataToClient from "../send-face-data-to-client.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("❄️ Redemption: Snowball");

class SnowballRedemption extends BaseRedemption {
  constructor({ streamingService, alerts }) {
    const title = "snowball";

    super({ streamingService, title });

    this.alerts = alerts;
    this.data = {
      id: "7de7d543-cf2f-434f-a319-eba5fd4e1496",
      title,
      prompt: "throw a club penguin snowball at me face",
      cost: 20,
      background_color: "#D5E4E7",
    };

    this.fufilledRedemption((data) => this.start(data));
  }

  async start() {
    logger.log("Triggered...");
    await sendFaceDataToClient({ io: this.io });
    this.alerts.send({
      type: "snowball",
      audioUrl: "/assets/alerts/penguin-throw-snowball-impact.mp3",
      duration: 2000,
      delayAudio: 500,
    });
  }
}

export default SnowballRedemption;
