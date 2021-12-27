import BaseRedemption from "./base-redemption.js";

import Logger from "../../helpers/logger.js";
const logger = new Logger("🤓 Redemption: Template");

class TemplateRedemption extends BaseRedemption {
  constructor({ io, streamingService }) {
    const title = "dance with zac";

    super({ streamingService, title });

    this.io = io;
    this.streamingService = streamingService;
    this.data = {};

    this.fufilledRedemption((data) => this.start(data));
    this.unfufilledRedemption((data) => this.start(data));
    this.cancelledRedemption((data) => this.start(data));
  }

  async start(data) {
    logger.log(data);
  }

  async stop(data) {
    logger.log(data);
  }
}

export default TemplateRedemption;
