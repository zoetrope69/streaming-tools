import obs from "../../obs/index.js";
import createGoosebumpsBookImage from "../../goosebumps/index.js";

import Logger from "../../helpers/logger.js";
const logger = new Logger("👾 Redemptions");

import BubblewrapTimeRedemption from "./bubblewrap-time.js";
import ShowYourPrideRedemption from "./show-your-pride/index.js";
import SnowballRedemption from "./snowball.js";
import DanceWithZacRedemption from "./dance-with-zac.js";
import DanceToASongRedemption from "./dance-to-a-song.js";
import ImmaBeeRedemption from "./immabee/index.js";
import BigDrinkRedemption from "./big-drink.js";
import ZacYouStinkRedemption from "./zac-you-stink.js";
import BigDataRedemption from "./big-data.js";
import RunescapeRedemption from "./runescape/index.js";
import BarryRedemption from "./barry.js";
import AllyPhilRedemption from "./ally-phil.js";

// TODO move this to base-redemption.js
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
];

class Redemptions {
  constructor({ io, streamingService, raspberryPi, alerts, music }) {
    // TODO these might not be neccessary once refactored
    this.io = io;
    this.streamingService = streamingService;
    this.raspberryPi = raspberryPi;
    this.alerts = alerts;
    this.music = music;

    this.goosebumpBook = null;

    const redemptions = {
      bubblewrapTime: BubblewrapTimeRedemption,
      showYourPride: ShowYourPrideRedemption,
      snowball: SnowballRedemption,
      danceWithZac: DanceWithZacRedemption,
      danceToASong: DanceToASongRedemption,
      immaBee: ImmaBeeRedemption,
      bigDrink: BigDrinkRedemption,
      zacYouStink: ZacYouStinkRedemption,
      bigData: BigDataRedemption,
      runescape: RunescapeRedemption,
      barry: BarryRedemption,
      ally: AllyPhilRedemption,
    };

    const allRedemptionsData = [...REDEMPTIONS];
    Object.keys(redemptions).forEach((key) => {
      const Redemption = redemptions[key];
      const redemption = new Redemption({
        io,
        streamingService,
        raspberryPi,
        alerts,
        music,
      });
      allRedemptionsData.push(redemption.data);
      this[key] = redemption;
    });

    this.redemptions = allRedemptionsData.map((redemption) => {
      // in development mode remove all cooldowns
      if (process.env.NODE_ENV === "development") {
        redemption.is_global_cooldown_enabled = false;
        redemption.global_cooldown_seconds = 0;
      }

      return {
        ...DEFAULT_REDEMPTION,
        ...redemption,
      };
    });

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

  // TODO will these be used?
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

    const handleScene = (sceneName) => {
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
    };

    // on load of the scripts
    const { name } = await obs.getCurrentScene();
    handleScene(name);

    await obs.handleSceneChange(handleScene);
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
