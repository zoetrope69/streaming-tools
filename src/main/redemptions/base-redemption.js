class BaseRedemption {
  constructor({ title, streamingService }) {
    this.title = title;
    this.streamingService = streamingService;
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
