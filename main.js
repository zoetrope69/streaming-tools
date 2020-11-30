// get process.env from .env
require("dotenv").config();
const { PORT } = process.env;

const { v4: randomID } = require("uuid");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const LastFM = require("./src/last-fm");
const TwitchBot = require("./src/twitch-bot");
const TwitchAPI = require("./src/twitch-api");
const logger = require("./src/helpers/logger");
const {
  getPrideFlag,
  getRandomPrideFlag,
  setLightsToPrideFlag,
} = require("./src/pride-flags");
const obs = require("./src/obs");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const twitchBot = TwitchBot();
const lastFM = LastFM();

const CLIENT_FILE_PATH = "client/build";

// serve client files
app.use(express.static(CLIENT_FILE_PATH));

app.get("/", (_request, response) => {
  response.sendFile(__dirname + CLIENT_FILE_PATH + "/index.html");
});

// initialise obs connection
obs.initialise();

TwitchAPI().then((twitchApi) => {
  twitchApi.on("follow", (user) => {
    const alert = {
      id: randomID(),
      type: "follow",
      user,
    };
    io.emit("data", { alert });
  });
});

twitchBot.on("message", async (twitchChatMessage) => {
  twitchChatMessage = twitchChatMessage.toLowerCase();

  if (twitchChatMessage === "!song") {
    const {
      artistName,
      trackName,
      albumName,
    } = lastFM.getCurrentTrack();

    if (!artistName || !trackName || !albumName) {
      twitchBot.say(`SingsNote Nothing is playing...`);
      return;
    }

    twitchBot.say(
      `SingsNote ${trackName} — ${artistName} — ${albumName}`
    );
  }

  if (twitchChatMessage.startsWith("!pride")) {
    const inputPrideFlagName = twitchChatMessage
      .replace("!pride", "")
      .trim();

    const prideFlag = getPrideFlag(inputPrideFlagName);

    if (prideFlag) {
      setLightsToPrideFlag(prideFlag.name);
      io.emit("data", { prideFlagName: prideFlag.name });
      if (prideFlag.twitchEmote) {
        twitchBot.say(`${prideFlag.twitchEmote} `.repeat(5));
      }
    } else {
      const randomPrideFlagName = getRandomPrideFlag().name;
      twitchBot.say(
        [
          inputPrideFlagName.length > 0
            ? `Didn't find anything for "${inputPrideFlagName}". :-(`
            : "",
          `Try something like: !pride ${randomPrideFlagName}`,
        ].join(" ")
      );
    }
  }

  obs.handleTriggers(twitchChatMessage);

  if (twitchChatMessage.startsWith("!help")) {
    const triggerHelpMessages = obs.TRIGGER_SOURCES.map(
      ({ name, description }) => `!${name}: ${description}`
    );

    const helpMessages = [
      "!song: gets the current playing song",
      "!pride: sets the flag at the top to a pride flag",
      ...triggerHelpMessages,
    ];

    helpMessages.forEach(twitchBot.say);
  }

  io.emit("data", { twitchChatMessage });
});

lastFM.on("track", (track) => {
  io.emit("data", { track });
});

io.on("connection", (socket) => {
  logger.info("👽 Stream Client", "Connected");

  const track = lastFM.getCurrentTrack();
  io.emit("data", { track });

  socket.on("disconnect", () => {
    logger.info("👽 Stream Client", "Disconnected");
  });
});

server.listen(PORT, () => {
  logger.info(
    "🛸 Stream Server",
    `Listening on http://localhost:${PORT}`
  );
});
