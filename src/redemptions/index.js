import obs from "../obs/index.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("👾 Redemptions");

import AllyPhilRedemption from "./ally-phil.js";
import BarryRedemption from "./barry.js";
import BigDataRedemption from "./big-data.js";
import BigDrinkRedemption from "./big-drink.js";
import BrendanTakeoverRedemption from "./brendan-takeover.js";
import BroomyJagRaceRedemption from "./broomy-jag-race.js";
import BubblewrapTimeRedemption from "./bubblewrap-time.js";
import ChangeAbletonTempoRedemption from "./change-ableton-tempo.js";
import DanceToASongRedemption from "./dance-to-a-song.js";
import DanceWithZacRedemption from "./dance-with-zac.js";
import GoosebumpsRedemption from "./goosebumps/index.js";
import ImmaBeeRedemption from "./immabee/index.js";
import NortyDevilRedemption from "./norty-devil.js";
import PogRedemption from "./pog.js";
import RunescapeRedemption from "./runescape/index.js";
import ScuffedKaraokeRedemption from "./scuffed-karaoke.js";
import ShowYourPrideRedemption from "./show-your-pride/index.js";
import SnowballRedemption from "./snowball.js";
import TextToPrintRedemption from "./text-to-print.js";
import JohnMarTTSonRedemption from "./tts-john-marston.js";
import ZacYouStinkRedemption from "./zac-you-stink.js";

const REDEMPTIONS = {
  ally: AllyPhilRedemption,
  barry: BarryRedemption,
  bigData: BigDataRedemption,
  bigDrink: BigDrinkRedemption,
  brendanTakeover: BrendanTakeoverRedemption,
  broomyJagRace: BroomyJagRaceRedemption,
  bubblewrapTime: BubblewrapTimeRedemption,
  changeAbletonTempo: ChangeAbletonTempoRedemption,
  danceToASong: DanceToASongRedemption,
  danceWithZac: DanceWithZacRedemption,
  goosebumps: GoosebumpsRedemption,
  immaBee: ImmaBeeRedemption,
  nortyDevil: NortyDevilRedemption,
  pog: PogRedemption,
  runescape: RunescapeRedemption,
  scuffedKaraoke: ScuffedKaraokeRedemption,
  showYourPride: ShowYourPrideRedemption,
  snowball: SnowballRedemption,
  textToPrint: TextToPrintRedemption,
  zacYouStink: ZacYouStinkRedemption,
  johnMarTTSon: JohnMarTTSonRedemption,
};

class Redemptions {
  constructor({
    io,
    streamingService,
    raspberryPi,
    alerts,
    music,
    ableton,
  }) {
    this.streamingService = streamingService;

    this.redemptions = Object.keys(REDEMPTIONS).map((key) => {
      const Redemption = REDEMPTIONS[key];

      const redemption = new Redemption({
        io,
        streamingService,
        raspberryPi,
        alerts,
        music,
        ableton,
      });

      this[key] = redemption;

      const { data } = redemption;

      // in development mode remove all cooldowns
      if (process.env.NODE_ENV === "development") {
        data.is_global_cooldown_enabled = false;
        data.global_cooldown_seconds = 0;
      }

      return data;
    });

    this.syncRedemptions();
    this.handleDancingRedemptions();
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
          this.hasRedemptionChanged(
            matchedExistingRedemption,
            redemption
          )
        ) {
          logger.debug(`Updating redemption "${redemption.title}"`);
          redemptionUpdatesAndCreations.push(
            this.streamingService.updateRedemption(redemption)
          );
        }

        return;
      }

      // no reward, create it
      logger.debug(`Creating redemption "${redemption.title}"`);
      redemptionUpdatesAndCreations.push(
        this.streamingService.createRedemption(redemption)
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
        redemptionsForDancing.forEach((redemption) => {
          this.streamingService.enableRedemption(redemption.id);
        });
        redemptionsNotForDancing.forEach((redemption) => {
          this.streamingService.disableRedemption(redemption.id);
        });
        return;
      }

      redemptionsForDancing.forEach((redemption) => {
        this.streamingService.disableRedemption(redemption.id);
      });
      redemptionsNotForDancing.forEach((redemption) => {
        this.streamingService.enableRedemption(redemption.id);
      });
    });
  }
}

export default Redemptions;
