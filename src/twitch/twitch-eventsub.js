const logger = require("../helpers/logger");

const eventSubExpress = require("./twitch-eventsub-express");

// https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types
async function TwitchEventSub({ app, twitchApi, eventEmitter }) {
  logger.info("🌯 Twitch EventSub", "Starting...");
  const expressEvents = eventSubExpress(app);

  async function subscribeToTopic(topic, callback) {
    try {
      expressEvents.on(topic, callback);

      // unsubscribe existing subscription
      const subscriptions =
        await twitchApi.eventSub.getSubscriptions();
      const existingSubscription = subscriptions.find(
        (subscription) => subscription.type === topic
      );
      if (existingSubscription) {
        await twitchApi.eventSub.unsubscribe(existingSubscription.id);
      }

      await twitchApi.eventSub.subscribe(topic);

      logger.info(
        "🌯 Twitch EventSub",
        `${topic} subscription successful`
      );
    } catch (e) {
      logger.error(
        "🌯 Twitch EventSub",
        `${topic} failed: ${typeof e === "string" ? e : e.message}`
      );
      logger.error("🌯 Twitch EventSub", e);
    }
  }

  // channel point redemptions
  const channelPointRedemptionHandler = (data) => {
    const {
      user_id,
      user_name,
      user_input,
      redeemed_at,
      status,
      reward,
    } = data;

    const dataEmit = {
      user: {
        id: user_id,
        username: user_name,
        message: user_input,
      },
      redeemedAt: redeemed_at,
      reward,
    };

    if (status === "unfulfilled") {
      eventEmitter.emit("channelPointRewardUnfulfilled", dataEmit);
    }

    if (status === "fulfilled") {
      eventEmitter.emit("channelPointRewardFulfilled", dataEmit);
    }

    if (status === "cancelled") {
      eventEmitter.emit("channelPointRewardCancelled", dataEmit);
    }
  };

  await Promise.all([
    // subbies
    await subscribeToTopic("channel.subscribe", (data) => {
      console.log("channel.subscribe data", data);
      const { user_id, user_name, is_gift } = data;
      eventEmitter.emit("subscribe", {
        isGift: is_gift,
        user: {
          id: user_id,
          username: user_name,
        },
      });
    }),
    // bitties
    await subscribeToTopic("channel.cheer", (data) => {
      console.log("channel.cheer data", data);
      const { user_id, user_name, is_anonymous, message, bits } =
        data;
      eventEmitter.emit("bits", {
        isAnonymous: is_anonymous,
        user: {
          id: user_id,
          username: user_name,
        },
        message,
        amount: bits,
      });
    }),
    // recieves a follow
    await subscribeToTopic("channel.follow", (data) => {
      const { user_id, user_name } = data;
      eventEmitter.emit("follow", {
        id: user_id,
        username: user_name,
      });
    }),
    // updates the category, title
    await subscribeToTopic("channel.update", (data) => {
      const { title, category_id, category_name } = data;
      eventEmitter.emit("channelInfo", {
        title,
        categoryId: category_id,
        categoryName: category_name,
      });
    }),
    // stream online/offline
    await subscribeToTopic("stream.online", () =>
      eventEmitter.emit("streamOnline", {})
    ),
    await subscribeToTopic("stream.offline", () =>
      eventEmitter.emit("streamOffline", {})
    ),
    await subscribeToTopic(
      "channel.channel_points_custom_reward_redemption.add",
      channelPointRedemptionHandler
    ),
    await subscribeToTopic(
      "channel.channel_points_custom_reward_redemption.update",
      channelPointRedemptionHandler
    ),
  ]);

  return eventEmitter;
}

module.exports = TwitchEventSub;
