const events = require("events");
const logger = require("./helpers/logger");

const eventSubExpress = require("./twitch-eventsub-express");

// https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types
async function TwitchEventSub(app, twitchApi) {
  const eventEmitter = new events.EventEmitter();

  logger.info("🌯 Twitch EventSub", "Starting...");
  const expressEvents = eventSubExpress(app);

  async function subscribeToTopic(topic, callback) {
    try {
      expressEvents.on(topic, callback);

      // unsubscribe existing subscription
      const subscriptions = await twitchApi.eventSub.getSubscriptions();
      if (subscriptions && subscriptions.length > 0) {
        subscriptions.forEach(async (subscription) => {
          if (subscription.type === topic) {
            await twitchApi.eventSub.unsubscribe(subscription.id);
          }
        });
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
      console.error(e);
    }
  }

  // recieves a follow
  await subscribeToTopic("channel.follow", (data) => {
    const { user_id, user_name } = data;
    eventEmitter.emit("follow", { id: user_id, username: user_name });
  });

  // updates the category, title
  await subscribeToTopic("channel.update", (data) => {
    const { title, category_id, category_name } = data;
    eventEmitter.emit("channelInfo", {
      title,
      categoryId: category_id,
      categoryName: category_name,
    });
  });

  // stream online/offline
  await subscribeToTopic("stream.online", () =>
    eventEmitter.emit("streamOnline", {})
  );
  await subscribeToTopic("stream.offline", () =>
    eventEmitter.emit("streamOffline", {})
  );

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

    if (status !== "fulfilled") {
      return;
    }

    eventEmitter.emit("channelPointRewardFulfilled", {
      user: {
        id: user_id,
        username: user_name,
        input: user_input,
      },
      redeemedAt: redeemed_at,
      reward,
    });
  };

  eventEmitter.emit("channelPointRewardFulfilled", {
    reward: { foo: "bar" },
  });
  await subscribeToTopic(
    "channel.channel_points_custom_reward_redemption.add",
    channelPointRedemptionHandler
  );
  await subscribeToTopic(
    "channel.channel_points_custom_reward_redemption.update",
    channelPointRedemptionHandler
  );

  return eventEmitter;
}

module.exports = TwitchEventSub;
