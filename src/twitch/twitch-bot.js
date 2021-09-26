const { EventEmitter } = require("events");
const tmi = require("tmi.js");

const replaceTextWithEmotes = require("./helpers/replace-text-with-emotes");

const Logger = require("../helpers/logger");
const logger = new Logger("🤖 Twitch Bot");

const {
  TWITCH_CLIENT_ID,
  TWITCH_BOT_OAUTH_TOKEN,
  TWITCH_BOT_USERNAME,
  TWITCH_BROADCASTER_NAME,
} = process.env;

function getCommand(message) {
  if (!message || !message.startsWith("!")) {
    return {};
  }

  const [command, ...commandArguments] = message
    .substring(1)
    .split(" ");

  return {
    command: command.toLowerCase(),
    commandArguments: commandArguments.join(" ").trim(),
  };
}

async function waitForTwitchBotToBeReady(botClient) {
  return new Promise((resolve) => {
    botClient.on("connected", () => {
      resolve();
    });
  });
}

async function TwitchBot({ eventEmitter }) {
  const chatEventEmitter = new EventEmitter();

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
      info: (message) => logger.info(message),
      warn: (message) => logger.warn(message),
      error: (message) => logger.error(message),
    },
  });

  try {
    botClient.connect();
  } catch (e) {
    logger.error(e.message || e);
  }

  logger.info("Starting...");

  botClient.on("part", (channel) => {
    logger.info(`Left: ${channel}`);
  });

  botClient.on("connected", () => {
    logger.info(`Connected`);
  });

  botClient.on("error", (err) => {
    logger.error(err);
  });

  botClient.on("close", () => {
    logger.info("Closed bot IRC connection");
  });

  botClient.on("message", async (_channel, data, message, self) => {
    const { badges, emotes, mod: isMod, color } = data;
    const username = data["display-name"];
    const isBroadcaster =
      username === TWITCH_BROADCASTER_NAME ||
      badges?.broadcaster === 1;

    logger.log(`Message from chat: ${message}`);

    const { command, commandArguments } = getCommand(message);

    const messageWithEmotes = await replaceTextWithEmotes(
      message,
      emotes
    );

    chatEventEmitter.emit("message", {
      isBot: self,
      isMod,
      isBroadcaster,
      message: message.trim(),
      messageWithEmotes,
      command,
      commandArguments,
      user: {
        username,
        color,
      },
    });
  });

  botClient.on(
    "resub",
    async (_channel, _username, _months, message, data) => {
      message = message.trim();
      const { emotes } = data;
      const id = data["user-id"];
      const username = data["display-name"];

      const { messageWithEmotes, messageWithNoEmotes } =
        await replaceTextWithEmotes(message, emotes);
      eventEmitter.emit("subscribe", {
        isGift: false,
        user: {
          id,
          username,
          message,
          messageWithEmotes,
          messageWithNoEmotes,
        },
      });
    }
  );

  botClient.on("raided", (_channel, username, viewers) => {
    const user = {
      username,
      viewers,
    };
    eventEmitter.emit("raid", user);
  });

  await waitForTwitchBotToBeReady(botClient);

  return {
    chat: Object.assign(chatEventEmitter, {
      sendMessage: (message) => {
        return botClient.say(TWITCH_BROADCASTER_NAME, message);
      },
      timeout: ({ username, lengthSeconds, reason }) => {
        return botClient.timeout(
          TWITCH_BROADCASTER_NAME,
          username,
          lengthSeconds,
          reason
        );
      },
    }),
  };
}

module.exports = TwitchBot;
