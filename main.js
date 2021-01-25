// get process.env from .env
require("dotenv").config();

const { PORT } = process.env;
const { v4: randomID } = require("uuid");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const ngrok = require("ngrok");

const { schedule } = require("./src/helpers/schedule");

const controlLols = require("./control-lols");

const LastFM = require("./src/last-fm");
const Twitch = require("./src/twitch");
const googleSheetCommands = require("./src/google-sheet-commands");
const createBeeImage = require("./src/imma-bee/create-bee-image");
const saveScreenshotToBrbScreen = require("./src/save-screenshot-to-brb-screen");
const textToSpeech = require("./src/text-to-speech");

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

let POPUP_MESSAGE = "";
let PAUSE_FOLLOW_ALERT = false;
let CURRENT_CHANNEL_INFO = {};

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

async function switchToBRBScene() {
  logger.info("🗺 Scene change", "BRB");
  const image = await obs.getWebcamImage();
  await saveScreenshotToBrbScreen(image);
  await obs.switchToScene("BRB");
}

async function main() {
  // initialise various things
  obs.initialise();
  googleSheetCommands.initialise();

  const ngrokUrl = await ngrok.connect(PORT);
  logger.info("👽 Ngrok URL", ngrokUrl);
  const twitch = await Twitch({ ngrokUrl, app });
  const lastFM = LastFM();

  obs.midiTriggers({
    "Scene change: BRB": async () => switchToBRBScene(),
  });

  // set and update channel info
  CURRENT_CHANNEL_INFO = await twitch.getChannelInfo();
  logger.info("🤖 Twitch Bot", "Setting channel info");
  twitch.on("channelInfo", async (channelInfo) => {
    logger.info("🤖 Twitch Bot", "Updating channel info");
    CURRENT_CHANNEL_INFO = channelInfo;
  });

  const scheduledCommands = await googleSheetCommands.getScheduledCommands();

  scheduledCommands.forEach((scheduledCommand) => {
    logger.info(
      "🤖 Twitch Bot",
      `Running !${scheduledCommand.name} ${scheduledCommand.schedule}`
    );
    schedule(scheduledCommand.schedule, () => {
      twitch.bot.say(scheduledCommand.value);
    });
  });

  twitch.on("subscribe", (data) => {
    sendAlertToClient({ type: "subscribe", ...data });
    twitch.bot.say(`hi @${data.user.username}, thanks for the sub!`);
  });

  twitch.on("bits", (data) => {
    sendAlertToClient({ type: "bits", ...data });
    twitch.bot.say(`hi @${data.user.username}, thanks for the bits!`);
  });

  twitch.on("follow", async (user) => {
    if (PAUSE_FOLLOW_ALERT) {
      return;
    }

    sendAlertToClient({ type: "follow", user });
    twitch.bot.say(`hi @${user.username}, thanks for following!`);

    // update follow total
    const followTotal = await twitch.getFollowTotal();
    io.emit("data", { followTotal });
  });

  twitch.on("raid", async (user) => {
    if (user.viewers > 50) {
      PAUSE_FOLLOW_ALERT = true;
      twitch.bot.say("big raid, follow alerts paused for 5 mins");
      setTimeout(() => {
        PAUSE_FOLLOW_ALERT = false;
        twitch.bot.say("follow alerts will happen again chief");
      }, 5 * 60 * 1000); // after 5 minutes resume again
    }

    let raidAudioUrl;
    try {
      raidAudioUrl = await textToSpeech(
        `oh shit here's ${user.username}`
      );
    } catch (e) {
      // couldnt get name audio
    }

    sendAlertToClient({ type: "raid", user, audioUrl: raidAudioUrl });
    twitch.bot.say(
      `hi @${user.username}, thanks for the raid! hi to the ${user.viewers} raiders.`
    );
  });

  twitch.on(
    "channelPointRewardFulfilled",
    async ({ reward, user }) => {
      const { title } = reward;
      const { message } = user;

      if (!title) {
        return;
      }

      if (title === "show your pride") {
        const inputPrideFlagName = message;

        if (inputPrideFlagName === "straight") {
          const { username } = user;
          twitch.bot.say("Ok mate... straight pride doesn't exist.");
          twitch.bot.timeout({
            username,
            lengthSeconds: 60,
            reason: "Trying to chat shit about straight pride",
          });
          return;
        }

        const prideFlag = getPrideFlag(inputPrideFlagName);

        if (prideFlag) {
          setLightsToPrideFlag(prideFlag.name);
          io.emit("data", { prideFlagName: prideFlag.name });
          if (prideFlag.twitchEmote) {
            twitch.bot.say(`${prideFlag.twitchEmote} `.repeat(5));
          }
        } else {
          const randomPrideFlagName = getRandomPrideFlag().name;
          twitch.bot.say(
            [
              inputPrideFlagName.length > 0
                ? `Didn't find anything for "${inputPrideFlagName}". :-(`
                : "",
              `Try something like: !pride ${randomPrideFlagName}`,
            ].join(" ")
          );
        }
      }

      if (title === "imma bee") {
        logger.log("🐝 Imma bee", "Triggered...");

        try {
          const image = await obs.getWebcamImage();
          await createBeeImage(image);
          sendAlertToClient({ type: "immabee" });
        } catch (e) {
          logger.error("🐝 Imma bee", e);
          twitch.bot.say(`Couldn't find Zac's face...`);
        }
      }

      if (title === "big data") {
        logger.log("😎 Big Data", "Triggered...");
        sendAlertToClient({ type: "bigdata" });
      }

      if (title === "ally phil") {
        logger.log("🥊 Phil Punch", "Triggered...");
        sendAlertToClient({ type: "philpunch", message });
      }

      if (title === "SPACE") {
        logger.log("🌌 SPACE", "Triggered...");
        obs.handleTriggers("space");
        setTimeout(() => {
          obs.handleTriggers("star-trek-slideshow");
          twitch.bot.say(
            `hip hop star trek by d-train https://www.youtube.com/watch?v=oTRKrzgVe6Y`
          );
        }, 50 * 1000); // minute into the video

        setTimeout(() => {
          obs.resetTriggers();
        }, 114 * 1000); // end of video
      }
    }
  );

  twitch.on(
    "message",
    async ({
      isMod,
      isBroadcaster,
      message,
      messageWithEmotes,
      command,
      commandArguments,
      user,
    }) => {
      if (command === "!song" || command === "!music") {
        const currentTrack = lastFM.getCurrentTrack();

        if (!currentTrack) {
          twitch.bot.say(`SingsNote Nothing is playing...`);
          return;
        }

        const {
          artistName,
          trackName,
          albumName,
        } = lastFM.getCurrentTrack();

        if (!artistName || !trackName || !albumName) {
          twitch.bot.say(`SingsNote Nothing is playing...`);
          return;
        }

        twitch.bot.say(
          `SingsNote ${trackName} — ${artistName} — ${albumName}`
        );
      }

      if (command === "!steve") {
        obs.handleTriggers("steve");
      }

      if (command === "!2020") {
        sendAlertToClient({ type: "fuck-2020" });
      }

      if (command === "!fightme" || command === "!fight") {
        controlLols({
          twitch,
          user,
          isMod,
          isBroadcaster,
          message,
        });
      }

      if (command === "!game" || command === "!category") {
        const { categoryName } = CURRENT_CHANNEL_INFO;
        if (categoryName) {
          if (categoryName === "Just Chatting") {
            twitch.bot.say(`zac's farting about chatting`);
          } else if (categoryName === "Makers & Crafting") {
            twitch.bot.say(`zac's making something`);
          } else {
            twitch.bot.say(`zac's playing ${categoryName}`);
          }
        } else {
          twitch.bot.say(`zac isn't doing anything... fuck all`);
        }
      }

      if (command === "!title") {
        if (CURRENT_CHANNEL_INFO.title) {
          twitch.bot.say(
            `stream title is "${CURRENT_CHANNEL_INFO.title}"`
          );
        } else {
          twitch.bot.say(`there is no stream title`);
        }
      }

      // the mod/broadcaster zooone
      if (isMod || isBroadcaster) {
        if (command === "!sign" || command === "!alert") {
          const newMessage = messageWithEmotes
            .replace("!sign", "")
            .replace("!alert", "")
            .trim();

          if (newMessage.length === 0) {
            return;
          }

          io.emit("data", { popUpMessage: newMessage });

          POPUP_MESSAGE = newMessage;
        }

        if (command === "!delete") {
          POPUP_MESSAGE = "";
          io.emit("data", { popUpMessage: "" });
        }

        if (command === "!follows") {
          if (PAUSE_FOLLOW_ALERT) {
            PAUSE_FOLLOW_ALERT = false;
            twitch.bot.say(
              "follow alerts will happen again now phew"
            );
          } else {
            PAUSE_FOLLOW_ALERT = true;
            twitch.bot.say("follow alerts paused for 5 mins");
            setTimeout(() => {
              PAUSE_FOLLOW_ALERT = false;
              twitch.bot.say("follow alerts will happen again");
            }, 5 * 60 * 1000); // after 5 minutes resume again
          }
        }

        if (command === "!say") {
          sendAlertToClient({
            type: "say",
            message: commandArguments,
            messageWithEmotes: messageWithEmotes
              .replace("!say", "")
              .trim(),
          });
        }

        if (command === "!brb") {
          await switchToBRBScene();
        }

        if (command === "!title") {
          const newTitle = commandArguments;
          if (!newTitle) {
            return;
          }

          try {
            await twitch.setChannelInfo({ title: newTitle });
          } catch (e) {
            twitch.bot.say(e.message);
          }
        }

        if (command === "!test-follow") {
          sendAlertToClient({
            type: "follow",
            user: { username: "ninja" },
          });
        }

        if (
          command === "!so" ||
          command === "!shoutout" ||
          command === "!shout-out"
        ) {
          let shoutOutUsername = commandArguments;
          if (!shoutOutUsername) {
            return;
          }

          if (shoutOutUsername.startsWith("@")) {
            shoutOutUsername = shoutOutUsername.substring(1);
          }

          if (!shoutOutUsername || shoutOutUsername.length === 0) {
            return;
          }

          const customShoutOuts = await twitch.getCustomShoutOuts();
          const customShoutOut = customShoutOuts.find(
            (shoutOut) =>
              shoutOut.username === shoutOutUsername.toLowerCase()
          );
          const shoutOutUser = await twitch.getUser(shoutOutUsername);

          if (!shoutOutUser) {
            return;
          }

          let nameAudioUrl;
          try {
            nameAudioUrl = await textToSpeech(shoutOutUser.username);
          } catch (e) {
            // couldnt get name audio
          }

          sendAlertToClient({
            type: "shout-out",
            user: shoutOutUser,
            loadImage: shoutOutUser.image,
            customShoutOut,
            audioUrl: nameAudioUrl,
          });

          twitch.bot.say(
            `shout out to ${
              customShoutOut
                ? customShoutOut.message
                : shoutOutUser.username
            } doing something cool over at twitch.tv/${
              shoutOutUser.username
            } Squid1 Squid2 zactopUs Squid2 Squid4`
          );
        }
      }

      const commands = await googleSheetCommands.getCommands();
      const chatCommand = commands.find(
        (c) => command === `!${c.name}`
      );
      if (chatCommand) {
        twitch.bot.say(chatCommand.value);
      }

      io.emit("data", {
        message,
        messageWithEmotes,
      });
    }
  );

  lastFM.on("track", (track) => {
    io.emit("data", { track });
  });

  io.on("connection", async (socket) => {
    logger.info("👽 Stream Client", "Connected");

    const followTotal = await twitch.getFollowTotal();
    const track = lastFM.getCurrentTrack();
    io.emit("data", {
      track,
      followTotal,
      popUpMessage: POPUP_MESSAGE,
    });

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
