// get process.env from .env
require("dotenv").config();

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

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const twitchBot = TwitchBot();
const lastFM = LastFM();

const PORT = 4000;

const CLIENT_FILE_PATH = "client/build";

// serve client files
app.use(express.static(CLIENT_FILE_PATH));

app.get("/", (_request, response) => {
  response.sendFile(__dirname + CLIENT_FILE_PATH + "/index.html");
});

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
  if (twitchChatMessage === "!song") {
    const track = lastFM.getCurrentTrack();

    if (!track) {
      twitchBot.say(`SingsNote Nothing is playing...`);
    }

    const { artistName, trackName, albumName } = track;

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
    } else {
      const randomPrideFlagName = getRandomPrideFlag().name;
      twitchBot.say(
        [
          inputPrideFlagName.length > 0
            ? `Didn't anything for "${inputPrideFlagName}". :-(`
            : "",
          `Try something like '!pride ${randomPrideFlagName}`,
        ].join(" ")
      );
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
