import { EventEmitter } from "events";
import tmi from "tmi.js";

import replaceTextWithEmotes from "./helpers/replace-text-with-emotes.js";

import Logger from "../helpers/logger.js";
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
    const { id, badges, emotes, mod: isMod, color } = data;
    const username = data["display-name"];
    const redemptionId = data["custom-reward-id"];
    const isBroadcaster =
      username === TWITCH_BROADCASTER_NAME ||
      badges?.broadcaster === 1;

    logger.log(`Message from chat: ${message}`);

    const { command, commandArguments } = getCommand(message);

    const { messageWithEmotes, messageWithNoEmotes, emoteImages } =
      await replaceTextWithEmotes({
        text: message,
        emoteDataFromTwitchBot: emotes,
      });

    chatEventEmitter.emit("message", {
      id,
      redemptionId,
      isBot: self,
      isMod,
      isBroadcaster,
      message: message.trim(),
      messageWithEmotes,
      messageWithNoEmotes,
      command,
      commandArguments,
      commandArgumentsWithEmotes: commandArguments,
      commandArgumentsWithNoEmotes: commandArguments,
      user: {
        username,
        color,
      },
      emoteImages,
    });
  });

  botClient.on(
    "resub",
    async (_channel, _username, _months, message, data) => {
      message = message.trim();
      const id = data["user-id"];
      const username = data["display-name"];

      const { messageWithEmotes, messageWithNoEmotes } =
        await replaceTextWithEmotes({
          text: message,
          emoteDataFromTwitchBot: data.emotes,
        });
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

  return Object.assign(chatEventEmitter, {
    sendMessage: async (message) => {
      return botClient.say(TWITCH_BROADCASTER_NAME, message);
    },
    deleteMessage: async (id) => {
      try {
        await botClient.deletemessage(TWITCH_BROADCASTER_NAME, id);
      } catch (error) {
        logger.error(error);
      }
    },
    timeout: async ({ username, lengthSeconds, reason }) => {
      try {
        await botClient.timeout(
          TWITCH_BROADCASTER_NAME,
          username,
          lengthSeconds,
          reason
        );
      } catch (error) {
        logger.error(error);
      }
    },
  });
}

export default TwitchBot;
