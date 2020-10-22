// get process.env from .env
require("dotenv").config();

const { exec } = require("child_process");

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const CommandKeys = require("./src/command-keys");
const showRecentTrackOnStream = require("./src/last-fm-show-recent-track-on-stream");
const twitchBot = require("./src/twitch-bot");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const commandKeys = CommandKeys();
const twitchChat = twitchBot();

// serve /public folder
app.use(express.static("public"));

// run as soon as we launch script
// run every 10 seconds after that
showRecentTrackOnStream();
setInterval(showRecentTrackOnStream, 1000 * 10);

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  commandKeys.on("change", (keys) => io.emit("keys", keys));
  twitchChat.on("message", (message) => {
    console.log("message", message);
    exec(`say "${message}"`);
    io.emit("twitch-chat-message", message);
  });
});

server.listen(4000, () => {
  console.log("listening on *:4000");
});
