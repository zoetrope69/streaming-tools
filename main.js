// get process.env from .env
require("dotenv").config();

const { v4: randomID } = require("uuid");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const LastFM = require("./src/last-fm");
const TwitchBot = require("./src/twitch-bot");
const TwitchAPI = require("./src/twitch-api");
const setLightsColor = require("./src/hue-bulbs");
const logger = require("./src/helpers/logger");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const twitchBot = TwitchBot();
const lastFM = LastFM();

const PORT = 4000;

const CLIENT_FILE_PATH = "client/build";

// serve client files
app.use(express.static(CLIENT_FILE_PATH));

app.get("/", function (req, res) {
  res.sendFile(
    __dirname + CLIENT_FILE_PATH + "/index.html"
  );
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

  const PRIDE_BANNERS = {
    pride: {
      colors: [
        "red",
        "orange",
        "yellow",
        "green",
        "blue",
        "purple",
      ],
    },
    agender: { colors: [] },
    aromantic: { colors: [] },
    asexual: { colors: [] },
    bisexual: { colors: [] },
    genderfluid: { colors: [] },
    genderqueer: { colors: [] },
    intersex: {
      colors: [
        "yellow",
        "purple",
        "yellow",
        "purple",
        "yellow",
      ],
    },
    lesbian: { colors: [] },
    "non-binary": { colors: [] },
    pansexual: { colors: [] },
    polysexual: { colors: [] },
    transgender: {
      colors: [
        "light blue",
        "pink",
        "white",
        "pink",
        "light blue",
      ],
    },
  };

  if (twitchChatMessage.startsWith("!pride")) {
    const prideBannerName = twitchChatMessage
      .replace("!pride", "")
      .trim();

    if (
      prideBannerName &&
      prideBannerName.length > 0 &&
      PRIDE_BANNERS[prideBannerName]
    ) {
      const { colors } = PRIDE_BANNERS[prideBannerName];
      io.emit("data", { prideBannerName });

      const COLOR_DURATION = 1500;
      colors.map((color, i) => {
        setTimeout(() => {
          setLightsColor(color);
        }, COLOR_DURATION * i);
      });

      // reset after all the other colours
      setTimeout(
        () => setLightsColor("reset"),
        COLOR_DURATION * colors.length
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
