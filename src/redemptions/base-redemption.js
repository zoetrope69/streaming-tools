const DEFAULT_REDEMPTION = {
  is_enabled: true,
  is_user_input_required: false,
  is_global_cooldown_enabled: false,
  global_cooldown_seconds: 0,
  is_paused: false,
  should_redemptions_skip_request_queue: true,
};

class BaseRedemption {
  constructor({ title, streamingService }) {
    this.title = title;
    this.streamingService = streamingService;
    this._data = {
      ...DEFAULT_REDEMPTION,
    };
  }

  get data() {
    return this._data;
  }

  set data(newData) {
    this._data = {
      ...this._data,
      ...newData,
    };
  }

  isValidReward(reward) {
    if (!reward || !reward.title) {
      return false;
    }

    return true;
  }

  unfufilledRedemption(callback) {
    this.streamingService.on(
      "channelPointRewardUnfulfilled",
      (data) => {
        const { reward } = data;

        if (!this.isValidReward(reward)) {
          return;
        }

        if (reward?.title === this.title) {
          callback(data);
        }
      }
    );
  }

  fufilledRedemption(callback) {
    this.streamingService.on(
      "channelPointRewardFulfilled",
      (data) => {
        const { reward } = data;

        if (!this.isValidReward(reward)) {
          return;
        }

        if (reward?.title === this.title) {
          callback(data);
        }
      }
    );
  }

  cancelledRedemption(callback) {
    this.streamingService.on(
      "channelPointRewardCancelled",
      (data) => {
        const { reward } = data;

        if (!this.isValidReward(reward)) {
          return;
        }

        if (reward?.title === this.title) {
          callback(data);
        }
      }
    );
  }
}

export default BaseRedemption;
