// get process.env from .env
import dotenv from "dotenv";
dotenv.config();

import path from "path";
import http from "http";

import express from "express";
import { Server } from "socket.io";

import Music from "./music/index.js";
import Twitch from "./twitch/twitch.js";
import textToSpeech from "./text-to-speech.js";
import obs from "./obs/index.js";

import ChannelInfo from "./channel-info.js";
import Alerts from "./alerts.js";
import Redemptions from "./redemptions/index.js";
import Logger from "./helpers/logger.js";
import Joycons from "./joycons.js";
import Launchpad from "./launchpad.js";
import RaspberryPi from "./raspberry-pi.js";
import Commands from "./commands.js";
import handleDanceTriggers from "./dance-triggers.js";
import { firstTimeTalking } from "./users-who-have-talked.js";

const { NGROK_URL, PORT } = process.env;
const CLIENT_FILE_PATH = "client/build";

const logger = new Logger("🛸 Streaming Tools Server");
const clientLogger = new Logger("👽 Streaming Tools Client");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const alerts = new Alerts({ io });

// allow json
app.use(express.json());

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
    alerts.send({
      type: "subscribe",
      duration: 5000,
      ...data,
    });

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
    alerts.send({
      type: "bits",
      duration: 5000,
      ...data,
    });
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

    await commands.handleGoogleSheetCommands({ command });

    if (command === "song" || command === "music") {
      await commands.song();
    }

    const firstTimeTalkingCallbacks = {
      EggEllie: () => redemptions.nortyDevil.start(),
      Broomyjag: () => redemptions.nortyDevil.start(),
      Bexchat: () => commands.bex(),
      BLGSTEVE: () => commands.octopussy(),
    };
    Object.keys(firstTimeTalkingCallbacks).forEach((username) => {
      const callback = firstTimeTalkingCallbacks[username];
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
      goosebumpsBookTitle: redemptions.goosebumps.bookTitle,
      prideFlagName: redemptions.showYourPride.prideFlagName,
      dancers: redemptions.danceWithZac.dancers,
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

async function handleNewMusicTracks({ music }) {
  music.on("track", (track) => {
    io.emit("data", { track });
  });
}

async function handleLaunchpadPresses({
  redemptions,
  commands,
  launchpad,
}) {
  launchpad.on("press", async ({ circle, position }) => {
    if (circle) {
      if (position === "D") {
        // STOP BUTTON
        await redemptions.scuffedKaraoke.stop();
        return;
      }

      if (position === "8") {
        await commands.switchToBRBScene();
        return;
      }
    }
  });
}

async function main() {
  server.listen(PORT, () => {
    logger.info(`Listening on http://localhost:${PORT}`);
  });

  // initialise various things
  await obs.initialise();

  const joycons = new Joycons({ app });
  const launchpad = new Launchpad({ app });
  const raspberryPi = new RaspberryPi({ app });
  const music = Music();
  const streamingService = await Twitch({
    ngrokUrl: NGROK_URL,
    app,
  });
  const channelInfo = new ChannelInfo();
  const redemptions = new Redemptions({
    io,
    streamingService,
    raspberryPi,
    alerts,
    music,
  });
  const commands = new Commands({
    io,
    streamingService,
    music,
    channelInfo,
    alerts,
  });

  handleDanceTriggers({ joycons });
  handleLaunchpadPresses({ launchpad, redemptions, commands });
  handleNewMusicTracks({ music });
  setTwitchTags({ streamingService });
  handleChannelInfo({ channelInfo, streamingService });
  handleSubscription({ streamingService });
  handleBits({ streamingService });
  handleRaid({ streamingService });
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
}

try {
  main();
} catch (e) {
  logger.error(e);
  logger.error(e.message);
}
