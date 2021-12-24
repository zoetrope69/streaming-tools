import obs from "../../obs/index.js";

import BaseRedemption from "./base-redemption.js";

import sendFaceDataToClient from "../send-face-data-to-client.js";

import Logger from "../../helpers/logger.js";
const logger = new Logger("🪰 Redemption: Zac You Stink");

class ZacYouStinkRedemption extends BaseRedemption {
  constructor({ io, streamingService, alerts }) {
    const title = "zac u stink";

    super({ streamingService, title });

    this.io = io;
    this.streamingService = streamingService;
    this.alerts = alerts;
    this.data = {
      id: "d20463be-3f02-490d-87d8-ea600e450857",
      title,
      prompt: "get stevesey to tell me i stinky :-(",
      cost: 50,
      background_color: "#2B5323",
    };

    this.fufilledRedemption((data) => this.start(data));
  }

  async start() {
    logger.log("Triggered...");

    const timeout = 10000;

    // send to client
    await sendFaceDataToClient({ io: this.io });
    this.alerts.send({
      type: "zac-you-stink",
      audioUrl: "/assets/alerts/zac-you-stink.mp3",
      duration: timeout,
    });

    // handle stinky filter in obs
    obs.showHideFilter({
      source: "Raw Webcam",
      filter: "Webcam: Stinky (Fade in)",
      filterEnabled: true,
    });
    setTimeout(() => {
      obs.showHideFilter({
        source: "Raw Webcam",
        filter: "Webcam: Stinky (Fade out)",
        filterEnabled: true,
      });
    }, timeout - 1000);

    // shout out to stevesey
    setTimeout(() => {
      this.streamingService.chat.sendMessage(
        `shout-out to twitch.tv/just_stevesey for telling me im stinky :-(`
      );
    }, timeout);
  }
}

export default ZacYouStinkRedemption;
