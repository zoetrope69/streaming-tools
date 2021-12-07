// get process.env from .env
import dotenv from "dotenv";
dotenv.config();

import path from "path";
import http from "http";

import express from "express";
import ExpressRateLimit from "express-rate-limit";
import { Server } from "socket.io";

import Music from "../music/index.js";
import Twitch from "../twitch/twitch.js";
import textToSpeech from "../text-to-speech.js";
import obs from "../obs/index.js";
import {
  createFilterVisibilityTriggers,
  createSourceVisibilityTriggers,
} from "../obs/helpers.js";
import ChannelInfo from "./channel-info.js";
import Alerts from "./alerts.js";
import Redemptions from "./redemptions.js";
import RaspberryPi from "./raspberry-pi.js";
import Commands from "./commands.js";
import { firstTimeTalking } from "./users-who-have-talked.js";

import Logger from "../helpers/logger.js";
const { NGROK_URL, PORT } = process.env;
const CLIENT_FILE_PATH = "client/build";

const logger = new Logger("🛸 Streaming Tools Server");
const clientLogger = new Logger("👽 Streaming Tools Client");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const alerts = new Alerts({ io });

// set up rate limiter: maximum of five requests per minute
const limiter = new ExpressRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50,
});

// allow json
app.use(express.json());

// apply rate limiter to all requests
app.use(limiter);

// serve client files
app.use(express.static(CLIENT_FILE_PATH));

app.get("/", (_request, response) => {
  response.sendFile(
    new URL(
      path.join(CLIENT_FILE_PATH, "/index.html"),
      import.meta.url
    )
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

      if (channelInfo.category !== categoryName) {
        channelInfo.setCategory(categoryName);
        streamingService.chat.sendMessage(
          `the category is now "${categoryName}"`
        );
      }

      if (channelInfo.title !== title) {
        channelInfo.setTitle(title);
        streamingService.chat.sendMessage(
          `the title is now "${title}"`
        );
      }
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
  raspberryPi,
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
    async (data) => {
      if (!isValidReward(data.reward)) {
        return;
      }

      const { title } = data.reward;

      if (title === "bubblewrap time") {
        await redemptions.bubblewrapTime.start({
          redemption: data,
        });
      }

      if (title === "big drink") {
        wasSpotifyPlayingMusic = await music.isSpotifyPlaying();
        if (wasSpotifyPlayingMusic) await music.spotify.pauseTrack();
        await redemptions.bigDrink.start();
      }

      if (title === "brendan takeover") {
        await redemptions.brendanTakeover.start();

        // maximum of 3 minute
        setTimeout(async () => {
          await redemptions.brendanTakeover.stop();
        }, 3 * 60 * 1000);
      }

      if (title === "BroomyJagRace") {
        const isSpotifyPlaying = await music.isSpotifyPlaying();
        if (isSpotifyPlaying) await music.spotify.pauseTrack();
        await redemptions.broomyJagRace.start();
      }

      if (title === "imma bee") {
        await redemptions.immaBee({
          redemption: data,
        });
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

      if (title === "bubblewrap time") {
        await redemptions.bubblewrapTime.stop();
      }

      if (title === "BroomyJagRace") {
        await redemptions.broomyJagRace.stop();
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
        await redemptions.broomyJagRace.stop();
      }

      if (title === "goosebumpz book") {
        await redemptions.goosebumps.start({ message, music });
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

      if (title === "ewww this song is doo doo") {
        const isSpotifyPlaying = await music.isSpotifyPlaying();
        if (isSpotifyPlaying) {
          await redemptions.thisSongIsDooDoo();
          await music.spotify.skipTrack();
        }
      }

      if (title === "bubblewrap time") {
        await redemptions.bubblewrapTime.stop();
      }

      if (title === "TTP (text-to-print)") {
        await redemptions.textToPrint({
          raspberryPi,
          messageWithNoEmotes,
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
    const {
      isMod,
      isBroadcaster,
      message,
      messageWithEmotes,
      command,
      commandArguments,
      user,
    } = data;

    io.emit("data", {
      message,
      messageWithEmotes,
    });

    // this is a promise but don't wait for it
    redemptions.bubblewrapTime.popBubbles();

    // TODO: is this working?
    await commands.handleGoogleSheetCommands({ command });

    if (command === "song" || command === "music") {
      await commands.song();
    }

    [
      { username: "EggEllie", callback: redemptions.nortyDevil },
      { username: "Broomyjag", callback: redemptions.nortyDevil },
      { username: "Bexchat", callback: commands.bex },
      { username: "BLGSTEVE", callback: commands.octopussy },
    ].forEach(({ username, callback }) => {
      firstTimeTalking(user, username, callback);
    });

    if (command === "game" || command === "category") {
      await commands.category({
        isMod,
        isBroadcaster,
        commandArguments,
      });
    }

    if (command === "title") {
      await commands.title({
        isMod,
        isBroadcaster,
        commandArguments,
      });
    }

    if (command === "thanos") {
      await commands.thanosDancing();
    }

    // the MOD zone

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

async function setTwitchTags({ streamingService }) {
  logger.info("Settings tags...");
  streamingService.setTags([
    "844102e5-5a43-42d6-ac49-de67946cafc5", // Queer
    "589c4c39-a3cc-41fa-b70c-bf0b735fa21f", // Mental Health
    "5532e712-9d64-4830-8ff9-ce83b8dcebfa", // Disabled
  ]);
}

async function main() {
  try {
    server.listen(PORT, () => {
      logger.info(`Listening on http://localhost:${PORT}`);
    });

    const raspberryPi = new RaspberryPi({ app });
    const music = Music();
    music.on("track", (track) => {
      io.emit("data", { track });
    });
    const streamingService = await Twitch({
      ngrokUrl: NGROK_URL,
      app,
    });
    setTwitchTags({ streamingService });
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

    const REDEMPTIONS_FOR_DANCING = [
      "dance with zac",
      "dance to a song",
      "ewww this song is doo doo",
    ];
    const REDEMPTIONS_NOT_FOR_DANCING = [];
    await obs.handleSceneChange((sceneName) => {
      if (sceneName.includes("Dance")) {
        REDEMPTIONS_FOR_DANCING.forEach((redemptionName) => {
          streamingService.enableRedemption(redemptionName);
        });
        REDEMPTIONS_NOT_FOR_DANCING.forEach((redemptionName) => {
          streamingService.disableRedemption(redemptionName);
        });
        return;
      }
      REDEMPTIONS_FOR_DANCING.forEach((redemptionName) => {
        streamingService.disableRedemption(redemptionName);
      });
      REDEMPTIONS_NOT_FOR_DANCING.forEach((redemptionName) => {
        streamingService.enableRedemption(redemptionName);
      });
    });
    handleChannelInfo({ channelInfo, streamingService });
    handleSubscription({ streamingService });
    handleBits({ streamingService });
    handleRaid({ streamingService });
    handleChannelPointRedemptions({
      streamingService,
      redemptions,
      music,
      raspberryPi,
    });
    handleChatMessages({
      streamingService,
      commands,
      redemptions,
      raspberryPi,
    });
    handleClientConnections({
      music,
      redemptions,
      commands,
    });
  } catch (e) {
    logger.error(e);
    logger.error(e.message);
  }
}

export default main;
