import BaseRedemption from "../base-redemption.js";

import createRunescapeTextImage from "./create-runescape-text-image.js";
import textToSpeech from "../../text-to-speech.js";

import Logger from "../../../helpers/logger.js";
const logger = new Logger("⚔️ Redemption: Runescape");

function getDuration(text) {
  if (!text || text.length === 0) {
    return 0;
  }

  const DELAY_TIME = 1500; // milliseconds before user starts reading the notification
  const BONUS_TIME = 1000; // extra time
  const WORD_PER_MINUTE = 200; // average words per minute
  const wordAmount = text.split(" ").length;

  if (wordAmount === 0) {
    return DELAY_TIME + BONUS_TIME;
  }

  const wordsTime = (wordAmount / WORD_PER_MINUTE) * 60 * 1000;

  return wordsTime + DELAY_TIME + BONUS_TIME;
}

class RunescapeRedemption extends BaseRedemption {
  constructor({ streamingService, alerts }) {
    const title = "runescape";

    super({ streamingService, title });

    this.alerts = alerts;
    this.streamingService = streamingService;
    this.data = {
      id: "e7159fe0-237e-4271-ae3a-680dd3abe928",
      title,
      prompt:
        "show runescape text on the screen - !runescape of how to customise text",
      cost: 300,
      background_color: "#8B4BA8",
      is_user_input_required: true,
    };

    this.fufilledRedemption((data) => this.start(data));
  }

  async start({ messageWithNoEmotes, user }) {
    if (!messageWithNoEmotes || messageWithNoEmotes.length === 0) {
      return;
    }

    logger.log("Triggered...");
    const runescapeTextImage = await createRunescapeTextImage(
      messageWithNoEmotes
    );
    if (!runescapeTextImage) {
      this.streamingService.chat.sendMessage(
        `couldn't send that text sorry @${user?.username}`
      );
      return;
    }

    const duration = getDuration(messageWithNoEmotes);

    let nameAudioUrl;
    try {
      nameAudioUrl = await textToSpeech(
        runescapeTextImage.messageWithoutOptions
      );
    } catch (e) {
      // couldnt get name audio
    }

    this.alerts.send({
      type: "runescape",
      duration,
      audioUrl: nameAudioUrl,
    });
  }
}

export default RunescapeRedemption;
