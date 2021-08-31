const obs = require("../obs");
const createBeeImage = require("../imma-bee/create-bee-image");
const createGoosebumpsBookImage = require("../goosebumps");

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
          "!so ameliabayler the water singer"
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
          "!so blgsteve for the pog audit"
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

  space() {
    return new Promise((resolve) => {
      logger.log("🌌 SPACE triggered...");
      obs.turnOnOverlay("Star Trek Space Video", 103 * 1000);
      setTimeout(() => {
        obs.turnOnOverlay("Star Trek Slideshow", 53 * 1000);
        this.streamingService.chat.sendMessage(
          `hip hop star trek by d-train https://www.youtube.com/watch?v=oTRKrzgVe6Y`
        );
        resolve();
      }, 50 * 1000); // minute into the video
    });
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
}

module.exports = Redemptions;
