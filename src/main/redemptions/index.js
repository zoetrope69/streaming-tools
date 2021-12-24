import { v4 as randomID } from "uuid";

import obs from "../../obs/index.js";
import createBeeImage from "../../imma-bee/create-bee-image.js";
import createGoosebumpsBookImage from "../../goosebumps/index.js";
import createRunescapeTextImage from "../../create-runescape-text-image.js";
import textToSpeech from "../../text-to-speech.js";

import sendFaceDataToClient from "../send-face-data-to-client.js";

import Logger from "../../helpers/logger.js";
const logger = new Logger("👾 Redemptions");

import BubblewrapTimeRedemption from "./bubblewrap-time.js";
import ThisSongIsDooDooRedemption from "./this-song-is-doo-doo.js";
import ShowYourPride from "./show-your-pride/index.js";

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

const DEFAULT_REDEMPTION = {
  is_enabled: true,
  is_user_input_required: false,
  is_global_cooldown_enabled: false,
  global_cooldown_seconds: 0,
  is_paused: false,
  should_redemptions_skip_request_queue: true,
};

const REDEMPTIONS = [
  {
    id: "1970bc27-8ffa-4cfd-ade3-ded68bb893c7",
    title: "dance with zac",
    prompt: "pop-up on the stream as a little blob bopping",
    cost: 5,
    background_color: "#002224",
    isForDancing: true,
  },
  {
    id: "f75ae948-4d4d-41a1-94c5-76315bc2bcb7",
    title: "dance to a song",
    prompt:
      "you can suggest something, but i have the executive decision",
    cost: 5,
    background_color: "#C2F9FD",
    is_user_input_required: true,
    isForDancing: true,
  },
  {
    id: "7de7d543-cf2f-434f-a319-eba5fd4e1496",
    title: "snowball",
    prompt: "throw a club penguin snowball at me face",
    cost: 20,
    background_color: "#D5E4E7",
  },
  {
    id: "975f6903-f026-4112-988a-a13d03a78049",
    title: "imma bee",
    prompt: "imma bee imma bee imma bee imma bee imma bee imma bee",
    cost: 300,
    background_color: "#FFF400",
    should_redemptions_skip_request_queue: false,
  },
  {
    id: "fc929918-95d5-4b79-9697-c4f6d8c36d13",
    title: "big drink",
    prompt: "it's time to hydrate",
    cost: 50,
    background_color: "#1E92FA",
    should_redemptions_skip_request_queue: false,
    is_global_cooldown_enabled: true,
    global_cooldown_seconds: 60 * 10, // 10 minutes
  },
  {
    id: "d20463be-3f02-490d-87d8-ea600e450857",
    title: "zac u stink",
    prompt: "get stevesey to tell me i stinky :-(",
    cost: 50,
    background_color: "#2B5323",
  },
  {
    id: "a102d4bc-570b-483b-b060-b5a8c99fd5f6",
    title: "big data",
    prompt:
      "google, facebook gonna f about with our data but... maybe i could be swayed...",
    cost: 500,
    background_color: "#A42688",
  },
  {
    id: "1d8c3308-035b-4466-adae-8cc5726bac26",
    title: "ally phil",
    prompt:
      "if phil removes something that isn't bigotry you will be warned/banned",
    cost: 120,
    background_color: "#052DA5",
    is_user_input_required: true,
  },
  {
    id: "8ad56fc6-f597-433c-b388-8e47ba23bc56",
    title: "pog",
    prompt:
      "now that, that right there is what we call pog on twitch",
    cost: 100,
    background_color: "#F4FF6B",
    is_global_cooldown_enabled: true,
    global_cooldown_seconds: 60 * 1, // 1 minutes
  },
  {
    id: "6b8cc18a-f927-41fd-9dbf-aca27fd1f0ec",
    title: "goosebumpz book",
    prompt: "only put in one or two words. e.g carrot cake",
    cost: 100,
    background_color: "#00C7AC",
    should_redemptions_skip_request_queue: false,
    is_user_input_required: true,
  },
  {
    id: "824b91da-d234-441f-bc55-0b1a148463b5",
    title: "brendan takeover",
    prompt: "mr fraiser takes over for a bit",
    cost: 200,
    background_color: "#B50028",
    should_redemptions_skip_request_queue: false,
    is_global_cooldown_enabled: true,
    global_cooldown_seconds: 60 * 5, // 5 minutes
  },
  {
    id: "4de612a1-1fea-40cd-a105-b40d4f8fcb00",
    title: "norty devil",
    prompt: "show one of EggEllie's norty devil artworks",
    cost: 666,
    background_color: "#000000",
    is_global_cooldown_enabled: true,
    global_cooldown_seconds: 60 * 1, // 1 minutes
  },
  {
    id: "e7159fe0-237e-4271-ae3a-680dd3abe928",
    title: "runescape",
    prompt:
      "show runescape text on the screen - !runescape of how to customise text",
    cost: 300,
    background_color: "#8B4BA8",
    is_user_input_required: true,
  },
  {
    id: "910b17fe-7a87-4a2a-860e-54cdf56b73e4",
    title: "BroomyJagRace",
    prompt: "start your broomers",
    cost: 800,
    background_color: "#FFFFFF",
    should_redemptions_skip_request_queue: false,
    is_global_cooldown_enabled: true,
    global_cooldown_seconds: 60 * 5, // 5 minutes
  },
  {
    id: "51411177-c629-48da-90da-1ecf9046e760",
    title: "barry",
    cost: 1111,
    background_color: "#05B33E",
    is_global_cooldown_enabled: true,
    global_cooldown_seconds: 60 * 5, // 5 minutes
    is_enabled: false,
  },
  {
    id: "f0ed621b-c66a-482b-9a5d-3af0aa9be656",
    title: "TTP (text-to-print)",
    prompt: "send something to the printer ennet",
    cost: 100,
    background_color: "#FFFFFF",
    should_redemptions_skip_request_queue: false,
    is_global_cooldown_enabled: true,
    global_cooldown_seconds: 60 * 1, // 1 minutes
    is_user_input_required: true,
  },
].map((redemption) => {
  // in development mode remove all cooldowns
  if (process.env.NODE_ENV === "development") {
    redemption.is_global_cooldown_enabled = false;
    redemption.global_cooldown_seconds = 0;
  }

  return redemption;
});

class Redemptions {
  constructor({ io, streamingService, raspberryPi, alerts, music }) {
    this.io = io;
    this.streamingService = streamingService;
    this.raspberryPi = raspberryPi;
    this.alerts = alerts;

    this.goosebumpBook = null;
    this.dancers = [];

    this.bubblewrapTime = new BubblewrapTimeRedemption({
      io,
      streamingService,
    });
    this.thisSongIsDooDoo = new ThisSongIsDooDooRedemption({
      streamingService,
      music,
    });
    this.showYourPride = new ShowYourPride({
      io,
      streamingService,
    });

    this.redemptions = [
      ...REDEMPTIONS,
      this.bubblewrapTime.data,
      this.thisSongIsDooDoo.data,
      this.showYourPride.data,
    ];

    this.syncRedemptions();
    this.handleDancingRedemptions();
    this.handleChannelPointRedemptionChatMessage();
  }

  // TODO will these be used?
  async enable({ id, title }) {
    if (id) {
      return this.streamingService.enableRedemption(id);
    }

    const redemption = this.redemptions.find(
      (redemption) => redemption.title === title
    );
    if (!redemption) {
      return;
    }

    return this.streamingService.enableRedemption(redemption.id);
  }

  async disable({ id, title }) {
    if (id) {
      return this.streamingService.disableRedemption(id);
    }

    const redemption = this.redemptions.find(
      (redemption) => redemption.title === title
    );
    if (!redemption) {
      return;
    }

    return this.streamingService.disableRedemption(redemption.id);
  }

  isRedemptionByIdTitle({ id, title }) {
    return this.redemptions.find((redemption) => {
      const isCorrectId = redemption.id === id;
      const isCorrectTitle = redemption.title === title;
      return isCorrectId && isCorrectTitle;
    });
  }

  hasRedemptionChanged(existingRedemption, redemption) {
    let hasChanged = false;

    Object.keys(redemption).forEach((key) => {
      if (
        !Object.prototype.hasOwnProperty.call(existingRedemption, key)
      ) {
        return;
      }

      if (existingRedemption[key] !== redemption[key]) {
        hasChanged = true;
      }
    });

    return hasChanged;
  }

  async syncRedemptions() {
    let existingRedemptions =
      await this.streamingService.getRedemptions();

    // delete any removed rewards
    const redemptionDeletions = [];
    existingRedemptions.forEach(async (existingRedemption) => {
      const matchedExpectedRedemptions = this.redemptions.find(
        (redemption) => {
          return redemption.id === existingRedemption.id;
        }
      );

      if (!matchedExpectedRedemptions) {
        logger.debug(
          `Deleting redemption "${existingRedemption.title}"`
        );
        redemptionDeletions.push(
          this.streamingService.deleteRedemption(
            existingRedemption.id
          )
        );
      }
    });
    await Promise.all(redemptionDeletions);

    existingRedemptions =
      await this.streamingService.getRedemptions();

    const redemptionUpdatesAndCreations = [];
    this.redemptions.forEach((redemption) => {
      const matchedExistingRedemption = existingRedemptions.find(
        (existingRedemption) => {
          return existingRedemption.id === redemption.id;
        }
      );

      // found a reward, update
      if (matchedExistingRedemption) {
        if (
          this.hasRedemptionChanged(matchedExistingRedemption, {
            ...DEFAULT_REDEMPTION,
            ...redemption,
          })
        ) {
          logger.debug(`Updating redemption "${redemption.title}"`);
          redemptionUpdatesAndCreations.push(
            this.streamingService.updateRedemption({
              ...DEFAULT_REDEMPTION,
              ...redemption,
            })
          );
        }

        return;
      }

      // no reward, create it
      logger.debug(`Creating redemption "${redemption.title}"`);
      redemptionUpdatesAndCreations.push(
        this.streamingService.createRedemption({
          ...DEFAULT_REDEMPTION,
          ...redemption,
        })
      );
    });
    await Promise.all(redemptionUpdatesAndCreations);
  }

  async handleDancingRedemptions() {
    const redemptionsForDancing = this.redemptions.filter(
      (redemption) => {
        return redemption.isForDancing === true;
      }
    );
    const redemptionsNotForDancing = this.redemptions.filter(
      (redemption) => {
        return redemption.isNotForDancing === true;
      }
    );

    await obs.handleSceneChange((sceneName) => {
      if (sceneName.includes("Dance")) {
        redemptionsForDancing.forEach(({ title }) => {
          this.enable({ title });
        });
        redemptionsNotForDancing.forEach(({ title }) => {
          this.disable({ title });
        });
        return;
      }

      redemptionsForDancing.forEach(({ title }) => {
        this.disable({ title });
      });
      redemptionsNotForDancing.forEach(({ title }) => {
        this.enable({ title });
      });
    });
  }

  async handleChannelPointRedemptionChatMessage() {
    this.streamingService.chat.on(
      "message",
      ({ id, redemptionId }) => {
        if (
          this.isRedemptionByIdTitle({
            id: redemptionId,
            title: "TTP (text-to-print)",
          })
        ) {
          this.streamingService.chat.deleteMessage(id);
          return;
        }
      }
    );
  }

  async danceWithMe({ username }) {
    logger.log("🕺 Dance With Me triggered...");
    const newDancer = await this.streamingService.getUser(username);

    if (!newDancer) {
      return;
    }

    newDancer.id = randomID();
    this.dancers.push(newDancer);
    this.io.emit("data", { dancers: this.dancers });

    setTimeout(() => {
      // remove from array
      this.dancers = this.dancers.filter((dancer) => {
        return dancer.id !== newDancer.id;
      });

      this.io.emit("data", { dancers: this.dancers });
    }, 1000 * 60 * 3 + 5000); // 3 minutes (+ wait for it to fade out on client)
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

  async immaBee({ redemption }) {
    logger.log("🐝 Imma bee triggered...");

    try {
      const image = await obs.getWebcamImage();
      await createBeeImage(image);
      this.alerts.send({ type: "immabee" });
      this.streamingService.updateRedemptionReward(redemption); // fulfill redemption
    } catch (e) {
      logger.error(`🐝 Imma bee ${JSON.stringify(e)}`);
      this.streamingService.chat.sendMessage(
        `Couldn't find Zac's face...`
      );
      this.streamingService.updateRedemptionReward(redemption, false); // cancel redemption
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
      start: async ({ message, music }) => {
        logger.log("📚 Goosebumps Book triggered...");
        try {
          const { bookTitle } = await createGoosebumpsBookImage(
            message
          );

          const isSpotifyPlaying = await music.isSpotifyPlaying();
          if (isSpotifyPlaying) await music.spotify.pauseTrack();

          this.io.emit("data", { goosebumpsBookTitle: bookTitle });
          this.goosebumpBook = bookTitle;
          await obs.switchToScene("Goosebumps");
        } catch (e) {
          logger.error(`📚 Goosebumps Book ${e.message || e}`);
          this.streamingService.chat.sendMessage(
            `Couldn't generate a book for ${message}`
          );
          this.goosebumpBook = null;
          await obs.switchToScene("Main Bigger Zac");
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
          source: "Snap Camera (Greenscreen)",
        });
      },
      stop: async () => {
        await obs.hideSource({
          scene: "Raw Webcam",
          source: "Brendan On His Switch",
        });
        await obs.showSource({
          scene: "Raw Webcam",
          source: "Snap Camera (Greenscreen)",
        });
      },
    };
  }

  async nortyDevil() {
    return new Promise((resolve) => {
      logger.log("👿 Norty Devil triggered...");
      const timeout = 20 * 1000;
      obs.turnOnOverlay("Stop Look At My Giant Ass", timeout);
      setTimeout(() => {
        this.streamingService.chat.sendMessage(
          `shout-out to twitch.tv/EggEllie the creator of the norty devils and twitch.tv/Broomyjag for the voice of the devil`
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

  async runescape({ messageWithNoEmotes, username }) {
    if (!messageWithNoEmotes || messageWithNoEmotes.length === 0) {
      return;
    }

    logger.log("⚔ Runescape triggered...");
    const runescapeTextImage = await createRunescapeTextImage(
      messageWithNoEmotes
    );
    if (!runescapeTextImage) {
      this.streamingService.chat.sendMessage(
        `couldn't send that text sorry @${username}`
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

  get textToPrint() {
    return {
      start: async ({ messageWithNoEmotes, redemption }) => {
        await obs.showSource({
          scene: "Overlays",
          source: "Printer Cam",
        });

        await this.raspberryPi.printText(messageWithNoEmotes, {
          isBig: true,
        });

        setTimeout(async () => {
          await obs.hideSource({
            scene: "Overlays",
            source: "Printer Cam",
          });

          try {
            // try and fulfill
            this.streamingService.updateRedemptionReward(redemption);
          } catch (e) {
            // do nuthin
          }
        }, 60 * 1000); // 1 minute later hide
      },
      stop: async () => {
        await obs.hideSource({
          scene: "Overlays",
          source: "Printer Cam",
        });
      },
    };
  }
}

export default Redemptions;
