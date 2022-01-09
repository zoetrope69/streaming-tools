/* eslint-disable */
import { setTimeout } from "timers/promises"; // eslint-disable-line node/no-missing-import
import obs from "../obs/index.js";

import BaseRedemption from "./base-redemption.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("🤓 Redemption: Template");

class TemplateRedemption extends BaseRedemption {
  constructor({ streamingService }) {
    const title = "";

    super({ streamingService, title });

    this.streamingService = streamingService;
    this.data = {
      title,
      prompt: "",
      cost: 100,
      background_color: "#FFF",
    };

    this.unfufilledRedemption((data) => this.start(data));
    this.fufilledRedemption((data) => this.stop(data));
    this.cancelledRedemption((data) => this.stop(data));
  }

  async start(data) {
    logger.log(data);
  }

  async stop(data) {
    logger.log(data);
  }
}

export default TemplateRedemption;
