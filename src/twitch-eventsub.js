const events = require("events");
const TES = require("tesjs");
const logger = require("./helpers/logger");

// https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types

const {
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  TWITCH_BROADCASTER_ID,
} = process.env;

async function TwitchEventSub(url, app) {
  const eventEmitter = new events.EventEmitter();

  logger.info("🌯 Twitch EventSub", "Starting...");

  const twitchEventSub = new TES({
    options: {
      logging: false,
    },
    identity: {
      id: TWITCH_CLIENT_ID,
      secret: TWITCH_CLIENT_SECRET,
    },
    listener: {
      baseURL: url,
      server: app,
    },
  });

  async function subscribeToTopic(topic, callback) {
    try {
      twitchEventSub.on(topic, (...data) => {
        logger.log("🌯 Twitch EventSub", `${topic} triggered`);
        callback(data);
      });

      // unsubscribe existing subscription
      const subscriptions = await twitchEventSub.getSubscriptions();
      if (subscriptions && subscriptions.data.length > 0) {
        subscriptions.data.forEach(async (subscription) => {
          if (subscription.type === topic) {
            await twitchEventSub.unsubscribe(subscription.id);
          }
        });
      }

      await twitchEventSub.subscribe(topic, {
        broadcaster_user_id: TWITCH_BROADCASTER_ID,
      });

      logger.info(
        "🌯 Twitch EventSub",
        `${topic} subscription successful`
      );
    } catch (e) {
      logger.error(
        "🌯 Twitch EventSub",
        `${topic} failed: ${typeof e === "string" ? e : e.message}`
      );
    }
  }

  // recieves a follow
  await subscribeToTopic("channel.follow", (data) => {
    const [id, username] = data;
    eventEmitter.emit("follow", { id, username });
  });

  // updates the category, title
  await subscribeToTopic("channel.update", (data) => {
    const [
      id,
      username,
      title,
      language,
      categoryId,
      categoryName,
      isMature,
    ] = data;

    eventEmitter.emit("channel", {
      id,
      username,
      title,
      language,
      categoryId,
      categoryName,
      isMature,
    });
  });

  return eventEmitter;
}

module.exports = TwitchEventSub;
