// get process.env from .env
require("dotenv").config();

const { v4: randomID } = require("uuid");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const CommandKeys = require("./src/command-keys");
const LastFM = require("./src/last-fm");
const TwitchBot = require("./src/twitch-bot");
const TwitchAPI = require("./src/twitch-api");
const setLightsColor = require("./src/hue-bulbs");
const logger = require("./src/helpers/logger");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const commandKeys = CommandKeys();
const twitchBot = TwitchBot();
const lastFM = LastFM();

const PORT = 4000;

// serve /public folder
app.use(express.static("public"));

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

commandKeys.on("change", (keys) => {
  io.emit("data", { keys });
});

twitchBot.on("message", (twitchChatMessage) => {
  if (twitchChatMessage === "!song") {
    const {
      artistName,
      trackName,
      albumName,
    } = lastFM.getCurrentTrack();
    twitchBot.say(
      `SingsNote ${trackName} — ${artistName} — ${albumName}`
    );
  }

  if (
    twitchChatMessage.startsWith("!color") ||
    twitchChatMessage.startsWith("!colour")
  ) {
    const color = twitchChatMessage
      .replace("!color", "")
      .replace("!colour", "")
      .trim();

    if (color && color.length > 0) {
      setLightsColor(color);
    }
  }

  if (twitchChatMessage.startsWith("!help")) {
    [
      "!color [colorname]: sets my lights to a color",
      "!song: gets the current playing song",
    ].forEach(twitchBot.say);
  }

  io.emit("data", { twitchChatMessage });
});

lastFM.on("track", (track) => {
  io.emit("data", { track });
});

io.on("connection", (socket) => {
  logger.info("👽 Stream Client", "Connected");

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
