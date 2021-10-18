// get process.env from .env
require("dotenv").config();

const path = require("path");

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const Twitch = require("../twitch");
const Music = require("../music");
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

const Logger = require("../helpers/logger");
const { NGROK_URL, PORT } = process.env;
const CLIENT_FILE_PATH = "client/build";

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
  music,
}) {
  let wasSpotifyPlayingMusic = false;

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
        wasSpotifyPlayingMusic = await music.isSpotifyPlaying();
        if (wasSpotifyPlayingMusic) await music.spotify.pauseTrack();
        await redemptions.bigDrink.start();
      }

      if (title === "brendan takeover") {
        await redemptions.brendanTakeover.start();

        // maximum of 1 minute
        setTimeout(async () => {
          await redemptions.brendanTakeover.stop();
        }, 60 * 1000);
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
        if (wasSpotifyPlayingMusic) {
          await music.spotify.playTrack();
          wasSpotifyPlayingMusic = false;
        }
      }

      if (title === "brendan takeover") {
        await redemptions.brendanTakeover.stop();
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
      const { message, messageWithNoEmotes, username } = user;

      if (title === "dance with zac") {
        await redemptions.danceWithMe({ username });
      }

      if (title === "pog") {
        await redemptions.pog();
      }

      if (title === "big drink") {
        await redemptions.bigDrink.stop();
        if (wasSpotifyPlayingMusic) {
          await music.spotify.playTrack();
          wasSpotifyPlayingMusic = false;
        }
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

      if (title === "snowball") {
        await redemptions.snowball();
      }

      if (title === "barry") {
        const isSpotifyPlaying = await music.isSpotifyPlaying();

        if (isSpotifyPlaying) await music.spotify.pauseTrack();
        await redemptions.barry();
        if (isSpotifyPlaying) await music.spotify.playTrack();
      }

      if (title === "BroomyJagRace") {
        const isSpotifyPlaying = await music.isSpotifyPlaying();
        if (isSpotifyPlaying) await music.spotify.pauseTrack();
        await redemptions.broomyJagRace.start();
      }

      if (title === "goosebumpz book") {
        const isSpotifyPlaying = await music.isSpotifyPlaying();
        if (isSpotifyPlaying) await music.spotify.pauseTrack();
        await redemptions.goosebumps.start({ message });
      }

      if (title === "brendan takeover") {
        await redemptions.brendanTakeover.stop();
      }

      if (title === "norty devil") {
        await redemptions.nortyDevil();
      }

      if (title === "zac u stink") {
        await redemptions.zacYouStink();
      }

      if (title === "runescape") {
        await redemptions.runescape({
          messageWithNoEmotes,
          username,
        });
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
    const { message, messageWithEmotes, command, user } = data;

    io.emit("data", {
      message,
      messageWithEmotes,
    });

    await commands.handleGoogleSheetCommands({ command });

    if (command === "song" || command === "music") {
      await commands.song();
    }

    if (user.username === "EggEllie") {
      firstTimeTalking("EggEllie", async () => {
        await redemptions.nortyDevil();
      });
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
      await commands.updateGoogleSheetCommands();
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

    if (command === "thanos") {
      await commands.thanosDancing();
    }
  });
}

async function handleClientConnections({
  music,
  redemptions,
  commands,
}) {
  clientLogger.info("Waiting for clients...");

  io.on("connection", async (socket) => {
    clientLogger.info("Connected");

    const currentTrack = await music.getCurrentTrack();

    socket.emit("data", {
      track: currentTrack,
      popUpMessage: commands.popUpMessage,
      goosebumpsBookTitle: redemptions.goosebumpBook,
      prideFlagName: redemptions.prideFlagName,
      dancers: redemptions.dancers,
    });

    socket.on("leap-motion", ({ event, data }) => {
      if (event === "frame-throttled") {
        return;
      }

      if (event === "connecting") {
        clientLogger.info("[🤚 Leap Motion] Connecting...");
        return;
      }

      if (event === "ready") {
        clientLogger.info("[🤚 Leap Motion] Ready...");
        return;
      }

      if (event === "deviceStreaming") {
        clientLogger.info(
          "[🤚 Leap Motion] Started streaming data..."
        );
        return;
      }

      if (event === "deviceStopped") {
        clientLogger.info(
          "[🤚 Leap Motion] Stopped streaming data..."
        );
        return;
      }

      clientLogger.debug(
        `[🤚 Leap Motion] ${JSON.stringify({ event, data })}`
      );
    });

    socket.emit("connected-to-server");

    socket.on("disconnect", () => {
      clientLogger.info("Disconnected");
    });
  });
}

async function main() {
  try {
    const music = Music();
    music.on("track", (track) => {
      io.emit("data", { track });
    });

    const streamingService = await Twitch({
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

    handleChannelInfo({ channelInfo, streamingService });
    handleSubscription({ streamingService });
    handleBits({ streamingService });
    handleRaid({ streamingService });
    handleChannelPointRedemptions({
      streamingService,
      redemptions,
      music,
    });
    handleChatMessages({
      streamingService,
      commands,
      redemptions,
    });
    handleModsChatMessages({
      streamingService,
      commands,
      redemptions,
    });
    handleClientConnections({
      music,
      redemptions,
      commands,
    });
  } catch (e) {
    logger.error(e || e.message);
  }
}

main();

server.listen(PORT, () => {
  logger.info(`Listening on http://localhost:${PORT}`);
});
