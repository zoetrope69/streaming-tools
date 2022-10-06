import { EventEmitter } from "events";

import OfficialYouTubeAPI from "./official-youtube-api.js";
import UnofficialYouTubeAPI from "./unofficial-youtube-api.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("▶️ YouTube");

class YouTube extends EventEmitter {
  constructor() {
    super();

    this.isConnected = false;

    // default is 10 lets allow for more
    this.setMaxListeners(100);

    this.officialYouTubeAPI = new OfficialYouTubeAPI();
    this.unofficialYouTubeAPI = null;

    this.officialYouTubeAPI.on("connected", (liveBroadcast) => {
      this.unofficialYouTubeAPI = new UnofficialYouTubeAPI({
        videoId: liveBroadcast.id,
      });

      this.unofficialYouTubeAPI.on("connected", () => {
        logger.info("Connected");

        this.emit("connected", true);
      });
    });
  }

  get chat() {
    return this.unofficialYouTubeAPI;
  }

  initialise() {
    return new Promise((resolve) => {
      this.on("connected", resolve);
    });
  }

  getChannelInfo() {
    if (!this.officialYouTubeAPI) {
      return {};
    }

    return {
      categoryName: null, // no categories on youtube?
      title: this.officialYouTubeAPI.title,
    };
  }

  async getViewerCount() {
    /*
      theres no current way of doing this
      so lets just pick a number out our ass

      will need to add this to masterchat upstream
      `primaryInfo.viewCount.videoViewCountRenderer.viewCount`
    */
    return 1;
  }

  async getUser() {
    // do nothing for now
    return null;
  }

  async disableRedemption() {
    // do nothing for now
    return null;
  }

  async enableRedemption() {
    // do nothing for now
    return null;
  }

  async setTitle() {
    // do nothing for now
    return null;
  }

  async setCategory() {
    // do nothing for now
    return null;
  }

  async fulfilRedemptionReward() {
    // do nothing for now
    return null;
  }

  async cancelRedemptionReward() {
    // do nothing for now
    return null;
  }
}

export default YouTube;
