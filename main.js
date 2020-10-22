// get process.env from .env
require("dotenv").config();

const { exec } = require("child_process");
const { v4: randomID } = require("uuid");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const CommandKeys = require("./src/command-keys");
const showRecentTrackOnStream = require("./src/last-fm-show-recent-track-on-stream");
const TwitchBot = require("./src/twitch-bot");
const TwitchAPI = require("./src/twitch-api");
const logger = require("./src/helpers/logger");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const commandKeys = CommandKeys();
const twitchBot = TwitchBot();
showRecentTrackOnStream();

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
  exec(`say "${twitchChatMessage}"`);
  io.emit("data", { twitchChatMessage });
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
