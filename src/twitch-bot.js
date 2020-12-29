const events = require("events");
const TwitchBot = require("twitch-bot");
const logger = require("./helpers/logger");

const eventEmitter = new events.EventEmitter();

const {
  TWITCH_BOT_OAUTH_TOKEN,
  TWITCH_BOT_USERNAME,
  TWITCH_BROADCASTER_NAME,
} = process.env;

const Bot = new TwitchBot({
  oauth: TWITCH_BOT_OAUTH_TOKEN,
  username: TWITCH_BOT_USERNAME,
  channels: [TWITCH_BROADCASTER_NAME],
});

logger.info("🤖 Twitch Bot", "Starting...");

Bot.on("part", (channel) => {
  logger.info("🤖 Twitch Bot", `Left: ${channel}`);
});

Bot.on("connected", () => {
  logger.info(
    "🤖 Twitch Bot",
    `Connected to: ${TWITCH_BROADCASTER_NAME}`
  );
  eventEmitter.emit("ready");
});

Bot.on("join", (channel) => {
  logger.info("🤖 Twitch Bot", `Joined channel: ${channel}`);
});

Bot.on("error", (err) => {
  logger.error("🤖 Twitch Bot", err);
});

Bot.on("message", (data) => {
  const { badges, mod: isMod, username, message, color } = data;
  const isBroadcaster =
    username === TWITCH_BROADCASTER_NAME || badges?.broadcaster === 1;

  if (isBroadcaster) {
    if (message.trim().startsWith("!stopBot")) {
      logger.info("🤖 Twitch Bot", "Turning off bot...");
      Bot.say("Turning off...");
      Bot.part(TWITCH_BROADCASTER_NAME);
      Bot.close();
      process.exit(1);
    }
  }

  logger.log("🤖 Twitch Bot", `Message from chat: ${message.trim()}`);

  eventEmitter.emit("message", {
    isMod,
    isBroadcaster,
    message: message.trim(),
    user: {
      username,
      color,
    },
  });
});

Bot.on("close", () => {
  logger.info("🤖 Twitch Bot", "Closed bot IRC connection");
});

// gross need to improve this
eventEmitter.say = (message) => Bot.say(message);

module.exports = () => eventEmitter;
