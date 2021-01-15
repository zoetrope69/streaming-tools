const tmi = require("tmi.js");
const replaceTextWithEmotes = require("./helpers/replace-text-with-emotes");
const logger = require("../helpers/logger");

const {
  TWITCH_CLIENT_ID,
  TWITCH_BOT_OAUTH_TOKEN,
  TWITCH_BOT_USERNAME,
  TWITCH_BROADCASTER_NAME,
} = process.env;

async function waitForTwitchBotToBeReady(botClient) {
  return new Promise((resolve) => {
    botClient.on("connected", () => {
      resolve();
    });
  });
}

async function TwitchBot({ eventEmitter }) {
  const botClient = new tmi.Client({
    options: {
      clientId: TWITCH_CLIENT_ID,
      debug: true,
      messagesLogLevel: "info",
    },
    connection: {
      reconnect: true,
      secure: true,
    },
    identity: {
      username: TWITCH_BOT_USERNAME,
      password: TWITCH_BOT_OAUTH_TOKEN,
    },
    channels: [TWITCH_BROADCASTER_NAME],
    logger: {
      info: (message) => logger.info("🤖 Twitch Bot", message),
      warn: (message) => logger.warn("🤖 Twitch Bot", message),
      error: (message) => logger.error("🤖 Twitch Bot", message),
    },
  });

  botClient.connect().catch((e) => {
    logger.error("🤖 Twitch Bot", e);
  });

  logger.info("🤖 Twitch Bot", "Starting...");

  botClient.on("part", (channel) => {
    logger.info("🤖 Twitch Bot", `Left: ${channel}`);
  });

  botClient.on("connected", () => {
    logger.info(
      "🤖 Twitch Bot",
      `Connected to: ${TWITCH_BROADCASTER_NAME}`
    );
  });

  botClient.on("join", (channel) => {
    logger.info("🤖 Twitch Bot", `Joined channel: ${channel}`);
  });

  botClient.on("error", (err) => {
    logger.error("🤖 Twitch Bot", err);
  });

  botClient.on("close", () => {
    logger.info("🤖 Twitch Bot", "Closed bot IRC connection");
  });

  botClient.on("message", async (_channel, data, message, self) => {
    const { badges, emotes, mod: isMod, color } = data;
    const username = data["display-name"];
    const isBroadcaster =
      username === TWITCH_BROADCASTER_NAME ||
      badges?.broadcaster === 1;

    logger.log("🤖 Twitch Bot", `Message from chat: ${message}`);

    let [command, ...commandArguments] = message.split(" ");

    const messageWithEmotes = await replaceTextWithEmotes(
      message,
      emotes
    );
    eventEmitter.emit("message", {
      isBot: self,
      isMod,
      isBroadcaster,
      message: message.trim(),
      messageWithEmotes,
      command: command.toLowerCase(),
      commandArguments: commandArguments.join(" ").trim(),
      user: {
        username,
        color,
      },
    });
  });

  botClient.on(
    "resub",
    async (_channel, _username, _months, message, data) => {
      console.log("resub data", { username, _months, message, data });
      message = message.trim();
      // const cumulativeMonths = ~~data["msg-param-cumulative-months"];
      const { emotes } = data;
      const id = data["user-id"];
      const username = data["display-name"];

      const messageWithEmotes = await replaceTextWithEmotes(
        message,
        emotes
      );
      eventEmitter.emit("subscribe", {
        isGift: false,
        user: {
          id,
          username,
          message,
          messageWithEmotes,
        },
      });
    }
  );

  botClient.on("raided", (_channel, username, viewers) => {
    console.log("raided", _channel, username, viewers);
    const user = {
      username,
      viewers,
    };
    eventEmitter.emit("raid", user);
  });

  await waitForTwitchBotToBeReady(botClient);

  return {
    bot: {
      say: (message) => {
        return botClient.say(TWITCH_BROADCASTER_NAME, message);
      },
    },
    eventEmitter,
  };
}

module.exports = TwitchBot;
