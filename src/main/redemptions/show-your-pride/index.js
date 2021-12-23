import {
  getPrideFlag,
  getRandomPrideFlag,
  setLightsToPrideFlag,
} from "./pride-flags.js";

import BaseRedemption from "../base-redemption.js";

import Logger from "../../../helpers/logger.js";
const logger = new Logger("💩 Redemption: This Song Is Doo Doo");

class ShowYourPride extends BaseRedemption {
  constructor({ io, streamingService }) {
    const title = "show your pride";

    super({ streamingService, title });

    this.io = io;
    this.streamingService = streamingService;
    this.data = {
      id: "3c3b6573-8de4-4adb-8187-8f760cafdb7e",
      title,
      prompt:
        "agender, aromantic, asexual, bisexual, gay, genderfluid, genderqueer, intersex, lesbian, non-binary, pansexual, polysexual, transgender - one missing? let me know",
      cost: 10,
      background_color: "#E7E7E7",
      is_user_input_required: true,
    };

    this.prideFlagName = "gay";

    this.fufilledRedemption(async ({ message, user }) => {
      return this.start({ message, user });
    });
  }

  async start({ message, user }) {
    logger.log("🌈 Pride flag triggered...");

    const [inputPrideFlagName] = message.split(" ");

    if (inputPrideFlagName === "straight") {
      this.streamingService.chat.sendMessage(
        "Ok mate... straight pride doesn't exist."
      );
      this.streamingService.chat.timeout({
        username: user?.username,
        lengthSeconds: 60,
        reason: "Trying to chat shit about straight pride",
      });
      return;
    }

    const prideFlag = getPrideFlag(inputPrideFlagName);

    if (!prideFlag) {
      const randomPrideFlagName = getRandomPrideFlag().name;
      this.streamingService.chat.sendMessage(
        [
          inputPrideFlagName.length > 0
            ? `Didn't find anything for "${inputPrideFlagName}". :-(`
            : "",
          `Try something like: ${randomPrideFlagName}`,
        ].join(" ")
      );
      return;
    }

    this.prideFlagName = prideFlag.name;
    setLightsToPrideFlag(prideFlag.name);
    this.io.emit("data", { prideFlagName: prideFlag.name });
    if (prideFlag.twitchEmote) {
      this.streamingService.chat.sendMessage(
        `${prideFlag.twitchEmote} `.repeat(5)
      );
    }
    if (prideFlag.twitchMessage) {
      this.streamingService.chat.sendMessage(prideFlag.twitchMessage);
    }
  }
}

export default ShowYourPride;
