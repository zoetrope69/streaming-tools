const obs = require("../obs");
const createBeeImage = require("../imma-bee/create-bee-image");
const createGoosebumpsBookImage = require("../goosebumps");
const createRunescapeTextImage = require("../create-runescape-text-image");
const textToSpeech = require("../text-to-speech");

const {
  getPrideFlag,
  getRandomPrideFlag,
  setLightsToPrideFlag,
} = require("./pride-flags");
const sendFaceDataToClient = require("./send-face-data-to-client");

const Alerts = require("./alerts");

const Logger = require("../helpers/logger");
const logger = new Logger("👾 Redemptions");

const { v4: randomID } = require("uuid");

function getDuration({ message }) {
  if (!message || message.length === 0) {
    return 0;
  }

  const DELAY_TIME = 1500; // milliseconds before user starts reading the notification
  const BONUS_TIME = 1000; // extra time
  const WORD_PER_MINUTE = 200; // average words per minute
  const wordAmount = message.split(" ").length;

  if (wordAmount === 0) {
    return DELAY_TIME + BONUS_TIME;
  }

  const wordsTime = (wordAmount / WORD_PER_MINUTE) * 60 * 1000;

  return wordsTime + DELAY_TIME + BONUS_TIME;
}

class Redemptions {
  constructor({ io, streamingService }) {
    this.io = io;
    this.streamingService = streamingService;

    this.alerts = new Alerts({ io });

    this.goosebumpBook = null;
    this.dancers = [];
    this.prideFlagName = "gay";
  }

  async danceWithMe(username) {
    logger.log("🕺 Dance With Me triggered...");
    const newDancer = await this.streamingService.getUser(username);
    newDancer.id = randomID();
    this.dancers.push(newDancer);

    this.io.emit("data", { dancers: this.dancers });

    setTimeout(() => {
      // remove from array
      this.dancers = this.dancers.filter((dancer) => {
        dancer.id !== newDancer.id;
      });
      this.io.emit("data", { dancers: this.dancers });
    }, 1000 * 60 * 3 + 5000); // 2 minutes (+ wait for it to fade out on client)
  }

  get bigDrink() {
    logger.log("🚰 Big Drink triggered...");
    return {
      start: async () => {
        await obs.showSource({
          scene: "Overlays",
          source: "Amelia Water Loop Music",
        });
        await obs.showSource({
          scene: "Overlays",
          source: "Amelia Water Loop Video",
        });
      },
      stop: async () => {
        await obs.hideSource({
          scene: "Overlays",
          source: "Amelia Water Loop Music",
        });
        await obs.hideSource({
          scene: "Overlays",
          source: "Amelia Water Loop Video",
        });

        this.streamingService.chat.sendMessage(
          "shout-out to twitch.tv/ameliabayler the water singer"
        );
      },
    };
  }

  pog() {
    return new Promise((resolve) => {
      logger.log("😮 Pog triggered...");
      const timeout = 9 * 1000;
      obs.turnOnOverlay("Steve Pointing Group", timeout);
      setTimeout(() => {
        this.streamingService.chat.sendMessage(
          "shout-out to twitch.tv/blgsteve for the pog audit"
        );
        resolve();
      }, timeout);
    });
  }

  async showYourPride({ message, username }) {
    logger.log("🌈 Pride flag triggered...");

    const [inputPrideFlagName] = message.split(" ");

    if (inputPrideFlagName === "straight") {
      this.streamingService.chat.sendMessage(
        "Ok mate... straight pride doesn't exist."
      );
      this.streamingService.chat.timeout({
        username,
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
          `Try something like: !pride ${randomPrideFlagName}`,
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
  }

  async immaBee() {
    logger.log("🐝 Imma bee triggered...");

    try {
      const image = await obs.getWebcamImage();
      await createBeeImage(image);
      this.alerts.send({ type: "immabee" });
    } catch (e) {
      logger.error(`🐝 Imma bee ${JSON.stringify(e)}`);
      this.streamingService.chat.sendMessage(
        `Couldn't find Zac's face...`
      );
    }
  }

  bigData() {
    logger.log("😎 Big Data triggered...");
    this.alerts.send({ type: "bigdata" });
  }

  allyPhil({ message }) {
    logger.log("🥊 Phil Punch triggered...");
    this.alerts.send({ type: "philpunch", message });
  }

  async snowball() {
    logger.log("❄ Snowball triggered...");
    await sendFaceDataToClient({ io: this.io });
    this.alerts.send({ type: "penguin-throw" });
  }

  barry() {
    return new Promise((resolve) => {
      logger.log(" Barry triggered...");
      const timeout = 104 * 1000;
      obs.turnOnOverlay("Barry Singing", timeout);
      setTimeout(() => {
        resolve();
      }, timeout);
    });
  }

  get broomyJagRace() {
    return {
      start: async () => {
        logger.log("🚗 BroomyJagRace triggered...");
        await obs.showSource({
          scene: "Overlays",
          source: "BroomyJagRace",
        });
      },
      stop: async () => {
        await obs.hideSource({
          scene: "Overlays",
          source: "BroomyJagRace",
        });
      },
    };
  }

  get goosebumps() {
    return {
      start: async ({ message }) => {
        logger.log("📚 Goosebumps Book triggered...");
        try {
          const { bookTitle } = await createGoosebumpsBookImage(
            message
          );
          this.io.emit("data", { goosebumpsBookTitle: bookTitle });
          this.goosebumpBook = bookTitle;
          await obs.switchToScene("Goosebumps");
        } catch (e) {
          logger.error(`📚 Goosebumps Book ${e.message || e}`);
          this.streamingService.chat.sendMessage(
            `Couldn't generate a book for ${message}`
          );
          this.goosebumpBook = null;
        }
      },

      stop: async () => {
        this.io.emit("data", { goosebumpsBookTitle: null });
        this.goosebumpBook = null;
        await obs.switchToScene("Main Bigger Zac");
      },
    };
  }

  get brendanTakeover() {
    return {
      start: async () => {
        logger.log("☠ Brendan Takeover triggered...");
        await obs.showSource({
          scene: "Raw Webcam",
          source: "Brendan On His Switch",
        });
        await obs.hideSource({
          scene: "Raw Webcam",
          source: "NVIDIA Broadcast Camera",
        });
      },
      stop: async () => {
        await obs.hideSource({
          scene: "Raw Webcam",
          source: "Brendan On His Switch",
        });
        await obs.showSource({
          scene: "Raw Webcam",
          source: "NVIDIA Broadcast Camera",
        });
      },
    };
  }

  nortyDevil() {
    return new Promise((resolve) => {
      logger.log("👿 Norty Devil triggered...");
      const timeout = 20 * 1000;
      obs.turnOnOverlay("Stop Look At My Giant Ass", timeout);
      setTimeout(() => {
        this.streamingService.chat.sendMessage(
          `shout-out to twitch.tv/EggEllie the creator of the norty devils`
        );
        this.streamingService.chat.sendMessage(
          `shout-out to twitch.tv/Broomyjag for the voice of the devil`
        );
        resolve();
      }, timeout);
    });
  }

  async zacYouStink() {
    logger.log("🦨 Zac you stink triggered...");
    const type = "zac-you-stink";
    const timeout = this.alerts.alertTypes[type].duration;

    // send to client
    await sendFaceDataToClient({ io: this.io });
    this.alerts.send({ type });

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

  async runescape({ message }) {
    if (!message || message.length === 0) {
      return;
    }

    logger.log("⚔ Runescape triggered...");
    const { messageWithoutOptions } = await createRunescapeTextImage(
      message
    );
    const duration = getDuration({ message });

    let nameAudioUrl;
    try {
      nameAudioUrl = await textToSpeech(messageWithoutOptions);
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

module.exports = Redemptions;
