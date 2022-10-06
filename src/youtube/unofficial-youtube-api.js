import { EventEmitter } from "events";

import { Masterchat, stringify } from "masterchat";

import Logger from "../helpers/logger.js";
const logger = new Logger("▶️ Unofficial YouTube API");

const { YOUTUBE_CREDENTIALS } = process.env;

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

class UnofficialYouTubeAPI extends EventEmitter {
  constructor({ videoId }) {
    super();

    this.unofficialYoutubeAPIClient = null;

    this.initialise({ videoId });
  }

  async sendMessage(message) {
    return this.unofficialYoutubeAPIClient.sendMessage(message);
  }

  async deleteMessage(chatId) {
    return this.unofficialYoutubeAPIClient.remove(chatId);
  }

  // async timeout({ username, lengthSeconds, reason }) {
  //   return this.unofficialYoutubeAPIClient.timeout(channelId);
  // }

  async initialise({ videoId }) {
    this.unofficialYoutubeAPIClient = await Masterchat.init(videoId, {
      credentials: YOUTUBE_CREDENTIALS,
    });

    this.unofficialYoutubeAPIClient.on("chat", (data) => {
      const { id, timestamp, message: rawMessage } = data;

      // ignore messages that are older than 30 secs
      const timeNow = new Date().getTime();
      const timeMessageSent = new Date(timestamp).getTime();
      const isOlderThan30Seconds =
        timeNow - timeMessageSent > 30 * 1000;
      if (isOlderThan30Seconds) {
        return;
      }

      const message = stringify(rawMessage);
      const messageWithEmotes = stringify(rawMessage, {
        emojiHandler: ({ emoji }) => {
          if (!emoji.isCustomEmoji) {
            return emoji.emojiId;
          }

          return "";
        },
      });
      const messageWithNoEmotes = stringify(rawMessage, {
        emojiHandler: () => "", // omit emojis
      });

      logger.log(`Message from chat: ${message}`);

      const { command, commandArguments } = getCommand(
        messageWithNoEmotes
      );

      this.emit("message", {
        id,
        isBot: false,
        isMod: data.isModerator,
        isBroadcaster: data.isOwner,
        message,
        messageWithEmotes,
        messageWithNoEmotes,
        command,
        commandArguments,
        commandArgumentsWithEmotes: commandArguments,
        commandArgumentsWithNoEmotes: commandArguments,
        user: {
          username: data.authorName,
          image: data.authorPhoto,
        },
      });
    });

    this.unofficialYoutubeAPIClient.on("error", (err) => {
      logger.error(err.code);
      // "disabled" => Live chat is disabled
      // "membersOnly" => No permission (members-only)
      // "private" => No permission (private video)
      // "unavailable" => Deleted OR wrong video id
      // "unarchived" => Live stream recording is not available
      // "denied" => Access denied (429)
      // "invalid" => Invalid request
    });

    this.unofficialYoutubeAPIClient.on("end", () => {
      this.emit("streamOffline", true);
    });

    this.unofficialYoutubeAPIClient.listen();

    await this.unofficialYoutubeAPIClient.populateMetadata(); // will scrape metadata from watch page

    if (this.unofficialYoutubeAPIClient.isLive) {
      logger.info("Connected");
      this.emit("connected", true);

      this.emit("streamOnline", true);
    }
  }
}

export default UnofficialYouTubeAPI;
