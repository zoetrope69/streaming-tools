import BaseRedemption from "./base-redemption.js";

import Logger from "../../helpers/logger.js";
const logger = new Logger("💪 Redemption: Big Data");

class BigDataRedemption extends BaseRedemption {
  constructor({ streamingService, alerts }) {
    const title = "big data";

    super({ streamingService, title });

    this.alerts = alerts;
    this.data = {
      id: "a102d4bc-570b-483b-b060-b5a8c99fd5f6",
      title,
      prompt:
        "google, facebook gonna f about with our data but... maybe i could be swayed...",
      cost: 500,
      background_color: "#A42688",
    };

    this.fufilledRedemption(() => this.start());
  }

  async start() {
    logger.log("Triggered...");
    this.alerts.send({
      type: "bigdata",
      audioUrl: "/assets/alerts/bigdata.mp3",
      duration: 6000,
    });
  }
}

export default BigDataRedemption;
