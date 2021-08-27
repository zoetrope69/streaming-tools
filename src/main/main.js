// get process.env from .env
require("dotenv").config();

const path = require("path");

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const Glimesh = require("../glimesh");
const Twitch = require("../twitch");
const Music = require("../music");
const KoFi = require("../ko-fi");
const googleSheetCommands = require("../google-sheet-commands");
const textToSpeech = require("../text-to-speech");
const obs = require("../obs");
const {
  createFilterVisibilityTriggers,
  createSourceVisibilityTriggers,
} = require("../obs/helpers");
const ChannelInfo = require("./channel-info");
const Alerts = require("./alerts");
const Redemptions = require("./redemptions");
const Commands = require("./commands");
const { firstTimeTalking } = require("./users-who-have-talked");

const { schedule } = require("../helpers/schedule");
const Logger = require("../helpers/logger");
const { initialiseHueBulbs } = require("./helpers/hue-bulbs");
const { NGROK_URL, PORT, STREAMING_SERVICE } = process.env;
const IS_GLIMESH = STREAMING_SERVICE === "glimesh";
const CLIENT_FILE_PATH = "client/build";

let GOOGLE_SHEET_COMMANDS = [];

const logger = new Logger("🛸 Streaming Tools Server");
const clientLogger = new Logger("👽 Streaming Tools Client");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const alerts = new Alerts({ io });

// serve client files
app.use(express.static(CLIENT_FILE_PATH));

app.get("/", (_request, response) => {
  response.sendFile(
    path.join(__dirname, CLIENT_FILE_PATH, "/index.html")
  );
});

function getStreamingService() {
  if (IS_GLIMESH) {
    return Glimesh;
  }

  return Twitch;
}

function handleKofi({ streamingService }) {
  const kofi = KoFi({ ngrokUrl: NGROK_URL, app });

  kofi.on("payment", ({ type, isAnonymous, user }) => {
    if (type === "Donation") {
      alerts.send({ type: "donation", user, isAnonymous });
      const userName = isAnonymous ? "bill gates" : user.username;
      streamingService.chat.sendMessage(
        `hi ${userName}, thanks for the donation!`
      );
    }
  });
}

async function handleChannelInfo({ channelInfo, streamingService }) {
  const { categoryName, title } =
    await streamingService.getChannelInfo();
  channelInfo.setCategory(categoryName);
  channelInfo.setTitle(title);

  streamingService.on(
    "channelInfo",
    async ({ categoryName, title }) => {
      logger.info("Updating category and title");
      channelInfo.setCategory(categoryName);
      channelInfo.setTitle(title);
    }
  );
}

async function handleRecurringCommands({ streamingService }) {
  try {
    GOOGLE_SHEET_COMMANDS = await googleSheetCommands.getCommands();
    const scheduledCommands =
      await googleSheetCommands.getScheduledCommands();
    scheduledCommands.forEach((scheduledCommand) => {
      logger.info(
        `Running !${scheduledCommand.name} ${scheduledCommand.schedule}`
      );
      schedule(scheduledCommand.schedule, () => {
        streamingService.chat.sendMessage(scheduledCommand.value);
      });
    });
  } catch (e) {
    logger.info("Couldn't run scheduled commands");
  }
}

async function handleSubscription({ streamingService }) {
  streamingService.on("subscribe", (data) => {
    alerts.send({ type: "subscribe", ...data });

    if (data.isGift) {
      streamingService.chat.sendMessage(
        `thanks for gifting a sub to @${data.user.username}`
      );
      return;
    }

    streamingService.chat.sendMessage(
      `hi @${data.user.username}, thanks for the sub!`
    );
  });
}

async function handleBits({ streamingService }) {
  streamingService.on("bits", (data) => {
    alerts.send({ type: "bits", ...data });
    const userName = data.isAnonymous
      ? "bill gates"
      : `@${data.user.username}`;
    streamingService.chat.sendMessage(
      `hi ${userName}, thanks for the bits!`
    );
  });
}

async function handleFollows({ streamingService }) {
  streamingService.on("follow", async (user) => {
    alerts.send({ type: "follow", user });
    streamingService.chat.sendMessage(
      `hi @${user.username}, thanks for following!`
    );

    // update follow total
    const followTotal = await streamingService.getFollowTotal();
    io.emit("data", { followTotal });
  });
}

async function handleRaid({ streamingService }) {
  streamingService.on("raid", async (user) => {
    let raidAudioUrl;
    try {
      raidAudioUrl = await textToSpeech(
        `oh shit here's ${user.username}`
      );
    } catch (e) {
      // couldnt get name audio
    }

    alerts.send({ type: "raid", user, audioUrl: raidAudioUrl });
    streamingService.chat.sendMessage(
      `hi @${user.username}, thanks for the raid! hi to the ${user.viewers} raiders.`
    );
  });
}

async function handleChannelPointRedemptions({
  streamingService,
  redemptions,
}) {
  function isValidReward(reward) {
    if (!reward || !reward.title) {
      return false;
    }

    return true;
  }

  streamingService.on(
    "channelPointRewardUnfulfilled",
    async ({ reward }) => {
      if (!isValidReward(reward)) {
        return;
      }

      const { title } = reward;

      if (title === "big drink") {
        await redemptions.bigDrink.start();
      }
    }
  );

  streamingService.on(
    "channelPointRewardCancelled",
    async ({ reward }) => {
      if (!isValidReward(reward)) {
        return;
      }

      const { title } = reward;

      if (title === "big drink") {
        await redemptions.bigDrink.stop();
      }
    }
  );

  streamingService.on(
    "channelPointRewardFulfilled",
    async ({ reward, user }) => {
      if (!isValidReward(reward)) {
        return;
      }

      const { title } = reward;
      const { message, username } = user;

      if (title === "dance with zac") {
        await redemptions.danceWithMe(username);
      }

      if (title === "pog") {
        await redemptions.pog();
      }

      if (title === "big drink") {
        await redemptions.bigDrink.stop();
      }

      if (title === "show your pride") {
        await redemptions.showYourPride({ message, username });
      }

      if (title === "imma bee") {
        await redemptions.immaBee();
      }

      if (title === "big data") {
        await redemptions.bigData();
      }

      if (title === "ally phil") {
        await redemptions.allyPhil({ message });
      }

      if (title === "SPACE") {
        await redemptions.space();
      }

      if (title === "snowball") {
        await redemptions.snowball();
      }

      if (title === "barry") {
        await redemptions.barry();
      }

      if (title === "BroomyJagRace") {
        await redemptions.broomyJagRace.start();
      }

      if (title === "goosebumpz book") {
        await redemptions.goosebumps.start({ message });
      }
    }
  );
}

async function handleChatMessages({
  streamingService,
  commands,
  redemptions,
}) {
  streamingService.chat.on("message", async (data) => {
    const {
      id,
      message,
      messageWithEmotes,
      command,
      user,
      tokens = [],
    } = data;

    io.emit("data", {
      message,
      messageWithEmotes,
    });

    const chatCommand = GOOGLE_SHEET_COMMANDS.find(
      ({ name }) => command === name
    );
    if (chatCommand) {
      streamingService.chat.sendMessage(chatCommand.value);
    }

    if (command === "song" || command === "music") {
      await commands.song();
    }

    if (user.username === "bexchat") {
      firstTimeTalking("bexchat", async () => {
        await commands.bex();
      });
    }

    if (user.username === "blgsteve") {
      firstTimeTalking("blgsteve", async () => {
        await commands.octopussy();
      });
    }

    if (command === "game" || command === "category") {
      await commands.category();
    }

    if (command === "title") {
      await commands.title();
    }

    if (IS_GLIMESH) {
      if (user.username === "bex") {
        firstTimeTalking("bex", async () => {
          await commands.bex();
        });
      }

      if (user.username === "bigsteve") {
        firstTimeTalking("bigsteve", async () => {
          await commands.octopussy();
        });
      }

      const hasMonkasEmote = tokens.some((token) => {
        return (
          token.type === "emote" && token.text === ":glimmonkas:"
        );
      });
      if (hasMonkasEmote) {
        streamingService.chat.deleteMessage(id);
        streamingService.chat.sendMessage(
          `@${user.username} no pepes please`
        );
      }

      if (command === "dance") {
        await redemptions.danceWithMe(user.username);
      }
    }
  });
}

async function handleModsChatMessages({
  streamingService,
  commands,
  redemptions,
}) {
  streamingService.chat.on("message", async (data) => {
    const {
      isMod,
      isBroadcaster,
      messageWithEmotes,
      command,
      commandArguments,
    } = data;

    if (!isMod && !isBroadcaster) {
      return;
    }

    if (command === "commands-update") {
      GOOGLE_SHEET_COMMANDS = await googleSheetCommands.getCommands();
    }

    if (command === "sign" || command === "alert") {
      await commands.setPopUpMessage({ messageWithEmotes });
    }

    if (command === "delete") {
      await commands.deletePopUpMessage();
    }

    if (command === "stop") {
      await redemptions.goosebumps.stop();
      await redemptions.broomyJagRace.stop();
    }

    if (command === "say") {
      await commands.say({ commandArguments, messageWithEmotes });
    }

    if (command === "brb") {
      await commands.switchToBRBScene();
    }

    if (
      command === "so" ||
      command === "shoutout" ||
      command === "shout-out"
    ) {
      await commands.shoutOut({ commandArguments });
    }
  });
}

async function handleClientConnections({
  streamingService,
  music,
  redemptions,
  commands,
}) {
  io.on("connection", async (socket) => {
    clientLogger.info("Connected");

    const followTotal = await streamingService.getFollowTotal();
    const currentTrack = await music.getCurrentTrack();

    socket.emit("data", {
      track: currentTrack,
      followTotal,
      popUpMessage: commands.popUpMessage,
      goosebumpsBookTitle: redemptions.goosebumpBook,
      prideFlagName: redemptions.prideFlagName,
      dancers: redemptions.dancers,
    });

    socket.on("disconnect", () => {
      clientLogger.info("Disconnected");
    });
  });
}

async function main() {
  // reset lights for streaming
  try {
    await initialiseHueBulbs();
  } catch (e) {
    logger.error(`💡 Hue Bulbs errored ${e.message || e}`);
  }

  const music = Music();
  music.on("track", (track) => {
    io.emit("data", { track });
  });

  const StreamingService = getStreamingService();
  const streamingService = await StreamingService({
    ngrokUrl: NGROK_URL,
    app,
  });

  const channelInfo = new ChannelInfo();
  const redemptions = new Redemptions({ io, streamingService });
  const commands = new Commands({
    io,
    streamingService,
    music,
    channelInfo,
  });

  // initialise various things
  await obs.initialise();
  createSourceVisibilityTriggers({ commands, redemptions });
  createFilterVisibilityTriggers();

  handleKofi({ streamingService });
  handleChannelInfo({ channelInfo, streamingService });
  handleRecurringCommands({ streamingService });
  handleSubscription({ streamingService });
  handleBits({ streamingService });
  handleFollows({ streamingService });
  handleRaid({ streamingService });
  handleChannelPointRedemptions({
    streamingService,
    redemptions,
  });
  handleChatMessages({ streamingService, commands, redemptions });
  handleModsChatMessages({ streamingService, commands, redemptions });
  handleClientConnections({
    streamingService,
    music,
    redemptions,
    commands,
  });
}

main();

server.listen(PORT, () => {
  logger.info(`Listening on http://localhost:${PORT}`);
});
