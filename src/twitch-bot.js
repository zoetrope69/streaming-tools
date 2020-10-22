const events = require("events");

const TwitchBot = require("twitch-bot");

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

console.log("Starting bot...");

Bot.on("part", (channel) => {
  console.log(`Bot left ${channel}`);
});

Bot.on("connected", () => {
  console.log("Connected to channel");
});

Bot.on("join", (channel) => {
  console.log(`Joined channel: ${channel}`);
});

Bot.on("error", (err) => {
  console.log(err);
});

Bot.on("message", (chatter) => {
  console.log("chatter", chatter);

  if (chatter.username === TWITCH_BROADCASTER_NAME) {
    if (chatter.message === "!stopBot") {
      Bot.say("Turning off...");
      Bot.part(TWITCH_BROADCASTER_NAME);
      Bot.close();
      process.exit(1);
    }
  }

  eventEmitter.emit("message", chatter.message);
});

Bot.on("close", () => {
  console.log("Closed bot IRC connection");
});

module.exports = () => eventEmitter;
