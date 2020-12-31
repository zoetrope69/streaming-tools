// get process.env from .env
require("dotenv").config();
const { PORT } = process.env;
const { v4: randomID } = require("uuid");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const ngrok = require("ngrok");

const { schedule } = require("./src/helpers/schedule");

const LastFM = require("./src/last-fm");
const TwitchBot = require("./src/twitch-bot");
const TwitchAPI = require("./src/twitch-api");
const TwitchEventSub = require("./src/twitch-eventsub");
const twitchCommands = require("./src/twitch-commands");
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

const CLIENT_FILE_PATH = "client/build";

// serve client files
app.use(express.static(CLIENT_FILE_PATH));

app.get("/", (_request, response) => {
  response.sendFile(__dirname + CLIENT_FILE_PATH + "/index.html");
});

function sendAlertToClient(options) {
  const alert = {
    id: randomID(),
    ...options,
  };
  io.emit("data", { alert });
}

async function main() {
  // initialise various things
  obs.initialise();
  twitchCommands.initialise();

  const ngrokUrl = await ngrok.connect(PORT);
  const twitchApi = await TwitchAPI();
  const twitchEventSub = await TwitchEventSub(ngrokUrl, app);
  const twitchBot = TwitchBot();
  const lastFM = LastFM();

  twitchBot.on("ready", async () => {
    const scheduledCommands = await twitchCommands.getScheduledCommands();

    scheduledCommands.forEach((scheduledCommand) => {
      logger.info(
        "🤖 Twitch Bot",
        `Running !${scheduledCommand.name} ${scheduledCommand.schedule}`
      );
      schedule(scheduledCommand.schedule, () => {
        twitchBot.say(scheduledCommand.value);
      });
    });

    twitchEventSub.on("follow", async (user) => {
      sendAlertToClient({ type: "follow", user });
      twitchBot.say(`hi @${user.username}, thanks for following!`);

      // update follow total
      const followTotal = await twitchApi.getFollowTotal();
      io.emit("data", { followTotal });
    });
  });

  twitchBot.on(
    "message",
    async ({
      isMod,
      isBroadcaster,
      message: twitchChatMessage,
      user,
    }) => {
      twitchChatMessage = twitchChatMessage.toLowerCase();

      if (twitchChatMessage === "!song") {
        const currentTrack = lastFM.getCurrentTrack();

        if (!currentTrack) {
          twitchBot.say(`SingsNote Nothing is playing...`);
          return;
        }

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

      if (twitchChatMessage.startsWith("!bigdata")) {
        sendAlertToClient({ type: "bigdata" });
      }

      // the mod/broadcaster zooone
      if (isMod || isBroadcaster) {
        if (twitchChatMessage.startsWith("!test-follow")) {
          console.log("hi");
          sendAlertToClient({
            type: "follow",
            user: { username: "ninja" },
          });
        }

        if (twitchChatMessage.startsWith("!so")) {
          let shoutOutUsername = twitchChatMessage.split(" ")[1];

          if (!shoutOutUsername) {
            return;
          }

          if (shoutOutUsername.startsWith("@")) {
            shoutOutUsername = shoutOutUsername.substring(1);
          }

          if (!shoutOutUsername || shoutOutUsername.length === 0) {
            return;
          }

          const shoutOutUser = await twitchApi.getUser(
            shoutOutUsername
          );

          if (!shoutOutUser) {
            return;
          }

          sendAlertToClient({
            type: "shout-out",
            user: shoutOutUser,
            loadImage: shoutOutUser.image,
          });

          twitchBot.say(
            `shout out to twitch.tv/${shoutOutUser.username} Squid1 Squid3 Squid4`
          );
        }
      }

      const commands = await twitchCommands.getCommands();
      const chatCommand = commands.find((command) =>
        twitchChatMessage.startsWith(`!${command.name}`)
      );
      if (chatCommand) {
        twitchBot.say(chatCommand.value);
      }

      io.emit("data", { twitchChatMessage });
    }
  );

  lastFM.on("track", (track) => {
    io.emit("data", { track });
  });

  io.on("connection", async (socket) => {
    logger.info("👽 Stream Client", "Connected");

    const followTotal = await twitchApi.getFollowTotal();
    const track = lastFM.getCurrentTrack();
    io.emit("data", { track, followTotal });

    socket.on("disconnect", () => {
      logger.info("👽 Stream Client", "Disconnected");
    });
  });
}

main();

server.listen(PORT, () => {
  logger.info(
    "🛸 Stream Server",
    `Listening on http://localhost:${PORT}`
  );
});
