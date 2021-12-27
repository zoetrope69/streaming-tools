import { setTimeout } from "timers/promises"; // eslint-disable-line node/no-missing-import
import obs from "../../obs/index.js";

import BaseRedemption from "./base-redemption.js";

import Logger from "../../helpers/logger.js";
const logger = new Logger("👿 Redemption: Norty Devil");

class NortyDevilRedemption extends BaseRedemption {
  constructor({ io, streamingService }) {
    const title = "norty devil";

    super({ streamingService, title });

    this.io = io;
    this.streamingService = streamingService;
    this.data = {
      id: "4de612a1-1fea-40cd-a105-b40d4f8fcb00",
      title,
      prompt: "show one of EggEllie's norty devil artworks",
      cost: 666,
      background_color: "#000000",
      is_global_cooldown_enabled: true,
      global_cooldown_seconds: 60 * 1, // 1 minutes
    };

    this.fufilledRedemption((data) => this.start(data));
  }

  async start() {
    logger.log("Triggered...");
    const timeout = 20 * 1000;
    obs.turnOnOverlay("Stop Look At My Giant Ass", timeout);
    await setTimeout(timeout);
    this.streamingService.chat.sendMessage(
      `shout-out to twitch.tv/EggEllie the creator of the norty devils and twitch.tv/Broomyjag for the voice of the devil`
    );
  }
}

export default NortyDevilRedemption;
