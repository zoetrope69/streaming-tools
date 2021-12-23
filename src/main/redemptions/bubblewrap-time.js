import { v4 as randomID } from "uuid";
import cache from "memory-cache";

import BaseRedemption from "./base-redemption.js";

import randomNumber from "../../helpers/random-number.js";

import Logger from "../../helpers/logger.js";
const logger = new Logger("🗯️ Redemption: Bubblewrap Time");

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const THIRTY_SECONDS_MS = 30 * 1000;

const INITIAL_BUBBLEWRAP = {
  bubbles: [],
  isStopping: false,
  isEnabled: false,
};
const BUBBLE_AMOUNT = 60;

class BubblewrapTimeRedemption extends BaseRedemption {
  constructor({ io, streamingService }) {
    const title = "bubblewrap time";

    super({ streamingService, title });

    this.io = io;
    this.streamingService = streamingService;
    this.data = {
      id: "48d766ce-4d60-4147-8ee1-5eac45a7acd1",
      title,
      prompt: "lets pop bubble together",
      cost: 80,
      background_color: "#131E5B",
      should_redemptions_skip_request_queue: false,
      is_global_cooldown_enabled: true,
      global_cooldown_seconds: 60,
    };

    this.bubblewrap = { ...INITIAL_BUBBLEWRAP };

    this.unfufilledRedemption((data) => this.start(data));
    this.fufilledRedemption((data) => this.stop(data));
    this.cancelledRedemption((data) => this.stop(data));
  }

  async getViewerCount() {
    const cacheKey = "bubblewrap-time-viewer-count";

    const cachedViewerCount = cache.get(cacheKey);

    if (cachedViewerCount) {
      return cachedViewerCount;
    }

    const viewerCount = await this.streamingService.getViewerCount();

    /*
      if there's no viewer count flush the cache after 30 seconds
      otherwise cache for 5 minutes
    */
    cache.put(
      cacheKey,
      viewerCount,
      viewerCount ? FIVE_MINUTES_MS : THIRTY_SECONDS_MS
    );

    return viewerCount;
  }

  updateBubblewrap(options) {
    this.bubblewrap = {
      ...this.bubblewrap,
      ...options,
    };
    this.io.emit("data", { bubblewrap: this.bubblewrap });
  }

  async popBubble() {
    const unpoppedBubbles = this.bubblewrap.bubbles.filter(
      (bubble) => {
        return !bubble.isPopped;
      }
    );

    if (unpoppedBubbles.length === 0) {
      return;
    }

    logger.log(
      `🔵 Pop bubble... ${
        this.bubblewrap.bubbles.length - unpoppedBubbles.length + 1
      }/${this.bubblewrap.bubbles.length}`
    );

    const randomUnpoppedBubble =
      unpoppedBubbles[
        Math.floor(Math.random() * unpoppedBubbles.length)
      ];
    const randomIndex = this.bubblewrap.bubbles.findIndex(
      (bubble) => bubble.id === randomUnpoppedBubble.id
    );

    this.bubblewrap.bubbles[randomIndex].isPopped = true;
    this.io.emit("data", { bubblewrap: this.bubblewrap });

    const hasAnyUnpoppedBubbles = this.bubblewrap.bubbles.some(
      (bubble) => {
        return !bubble.isPopped;
      }
    );
    if (!hasAnyUnpoppedBubbles) {
      try {
        // try and fulfill
        this.streamingService.updateRedemptionReward(
          this.bubblewrap.redemption
        );
      } catch (e) {
        // do nuthin
      }

      await this.stop();
    }
  }

  async popBubbles() {
    if (!this.bubblewrap.isEnabled || this.bubblewrap.isStopping) {
      return;
    }

    const viewerCount = await this.getViewerCount();

    logger.debug(
      viewerCount
        ? `💩 Viewer count is ${viewerCount}`
        : `💩 Couldn't get viewer count`
    );

    /*
      if we couldn't get the viewer count 
      OR
      if we have enough viewers for a bubble each

      only pop one bubble for a message
    */
    if (!viewerCount || viewerCount >= BUBBLE_AMOUNT) {
      await this.popBubble();
      return;
    }

    /*
      give each user an amount of bubbles to pop
      but dont give them too many
    */
    const bubblesToPopAmount = Math.min(
      Math.floor(BUBBLE_AMOUNT / 6),
      Math.floor(BUBBLE_AMOUNT / viewerCount)
    );

    logger.log(`🔵 Popping ${bubblesToPopAmount} bubbles...`);

    // pop bubbles at a random pace
    for (let i = 0; i < bubblesToPopAmount; i++) {
      setTimeout(() => {
        this.popBubble();
      }, randomNumber(100, 400) * i);
    }
  }

  async start(redemption) {
    if (this.bubblewrap.isEnabled || this.bubblewrap.isStopping) {
      return;
    }

    logger.log("Triggered...");

    this.updateBubblewrap({
      redemption,
      isEnabled: true,
      bubbles: Array.from({ length: BUBBLE_AMOUNT }, () => ({
        id: randomID(),
        isPopped: false,
      })),
    });
    this.streamingService.disableRedemption(this.data.id);
    this.getViewerCount(); // prime the cache with viewer
  }

  async stop() {
    if (!this.bubblewrap.isEnabled || this.bubblewrap.isStopping) {
      return;
    }

    logger.log("🔵 Bubblewrap stopping...");
    this.updateBubblewrap({ isStopping: true });

    setTimeout(() => {
      logger.log("🔵 Bubblewrap stopped...");
      this.updateBubblewrap(INITIAL_BUBBLEWRAP);
      this.streamingService.enableRedemption(this.data.id);
    }, 2000);
  }
}

export default BubblewrapTimeRedemption;
