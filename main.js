// get process.env from .env
require("dotenv").config();

const path = require("path");

const { v4: randomID } = require("uuid");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const ngrok = require("ngrok");

const { schedule } = require("./src/helpers/schedule");

const logger = require("./src/helpers/logger");

const Glimesh = require("./src/glimesh");
const Twitch = require("./src/twitch");
const Music = require("./src/music");
const KoFi = require("./src/ko-fi");
const googleSheetCommands = require("./src/google-sheet-commands");
const createBeeImage = require("./src/imma-bee/create-bee-image");
const detectFaces = require("./src/helpers/detect-faces");
const saveScreenshotToBrbScreen = require("./src/save-screenshot-to-brb-screen");
const textToSpeech = require("./src/text-to-speech");
const { initialiseHueBulbs } = require("./src/helpers/hue-bulbs");
const {
  getPrideFlag,
  getRandomPrideFlag,
  setLightsToPrideFlag,
} = require("./src/pride-flags");
const obs = require("./src/obs");
const createGoosebumpsBookImage = require("./src/goosebumps");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const { NGROK_AUTH_TOKEN, NGROK_SUBDOMAIN, PORT, STREAMING_SERVICE } =
  process.env;
const IS_GLIMESH = STREAMING_SERVICE === "glimesh";
const CLIENT_FILE_PATH = "client/build";
let STEVE_HAS_TALKED = false;
let BEX_HAS_TALKED = false;
let POPUP_MESSAGE = "";
let PAUSE_FOLLOW_ALERT = false;
let CURRENT_CHANNEL_INFO = {};
let ALERT_QUEUE = [];
let ALERT_IS_RUNNING = false;
let CURRENT_GOOSEBUMP_BOOK = null;
let CURRENT_PRIDE_FLAG_NAME = "gay";
let CURRENT_DANCERS = [];
let GOOGLE_SHEET_COMMANDS = [];

const ALERT_TYPES = {
  "shout-out": {
    duration: 10000,
    delayAudio: 3100,
  },
  bits: {
    duration: 5000,
  },
  subscribe: {
    duration: 5000,
  },
  donation: {
    duration: 5000,
  },
  follow: {
    duration: 5000,
  },
  say: {
    duration: 5000,
  },
  bigdata: {
    audioUrl: "/assets/alerts/bigdata.mp3",
    duration: 6000,
  },
  immabee: {
    audioUrl: "/assets/alerts/immabee.mp3",
    duration: 4000,
  },
  "fuck-2020": {
    audioUrl: "/assets/alerts/fuck-2020.mp3",
    duration: 3000,
  },
  philpunch: {
    audioUrl: "/assets/alerts/phil-punch.mp3",
    duration: 5000,
    delayAudio: 1000,
  },
  "penguin-throw": {
    audioUrl: "/assets/alerts/penguin-throw-snowball-impact.mp3",
    duration: 2000,
    delayAudio: 900,
  },
  bexchat: {
    audioUrl: "/assets/alerts/bexchat.mp3",
    duration: 10000,
  },
};

function addToAlertQueue(alert) {
  const newAlertQueue = ALERT_QUEUE.concat([alert]);
  ALERT_QUEUE = newAlertQueue;
}

function removeAlertFromQueue(alertId) {
  const newAlertQueue = ALERT_QUEUE.filter(
    (alert) => alert.id !== alertId
  );
  ALERT_QUEUE = newAlertQueue;
}

// serve client files
app.use(express.static(CLIENT_FILE_PATH));

app.get("/", (_request, response) => {
  response.sendFile(
    path.join(__dirname, CLIENT_FILE_PATH, "/index.html")
  );
});

function processAlert() {
  if (ALERT_QUEUE.length === 0) {
    io.emit("data", { alert: {} });
    return;
  }

  // if alert is running we wait for it to finish
  if (ALERT_IS_RUNNING) {
    return;
  }

  ALERT_IS_RUNNING = true;
  const [alert] = ALERT_QUEUE;
  io.emit("data", { alert: {} }); // clear current alert
  io.emit("data", { alert });

  if (alert.duration) {
    setTimeout(() => {
      removeAlertFromQueue(alert.id);
      ALERT_IS_RUNNING = false;

      // get next alert if there
      processAlert();
    }, alert.duration);
  }
}

function sendAlertToClient(options) {
  const alertType = ALERT_TYPES[options.type];
  const alert = {
    id: randomID(),
    ...alertType,
    ...options,
  };
  addToAlertQueue(alert);
  processAlert();
}

async function switchToBRBScene() {
  logger.info("🗺 Scene change", "BRB");
  try {
    const image = await obs.getWebcamImage();
    await saveScreenshotToBrbScreen(image);
    await obs.switchToScene("BRB");
  } catch (e) {
    logger.error("🤖 Streaming Tools", e.message);
  }
}

async function turnOnOverlay(source, timeout) {
  await obs.hideSource({
    scene: "Overlays",
    source,
  });

  setTimeout(() => {
    obs.showSource({
      scene: "Overlays",
      source,
    });

    if (timeout) {
      setTimeout(() => {
        obs.hideSource({
          scene: "Overlays",
          source,
        });
      }, timeout);
    }
  }, 100); // wait 100 ms i guess
}

async function createNgrokUrl() {
  let ngrokUrl;

  if (!(NGROK_AUTH_TOKEN && NGROK_SUBDOMAIN && PORT)) {
    logger.error("👽 Ngrok", "No environment variables");
    return null;
  }

  try {
    ngrokUrl = await ngrok.connect({
      addr: PORT,
      authtoken: NGROK_AUTH_TOKEN,
      region: "eu",
      subdomain: NGROK_SUBDOMAIN,
    });
  } catch (error) {
    logger.error("👽 Ngrok", error.message);
  }

  if (!ngrokUrl) {
    logger.error("👽 Ngrok", "No Ngrok URL");
    return null;
  }

  logger.info("👽 Ngrok", `URL: ${ngrokUrl}`);

  return ngrokUrl;
}

function getStreamingService() {
  if (IS_GLIMESH) {
    return Glimesh;
  }

  return Twitch;
}

async function main() {
  // reset lights for streaming
  initialiseHueBulbs().catch((error) =>
    logger.error("💡 Hue Bulbs", error.message)
  );

  // initialise various things
  await obs.initialise();
  const ngrokUrl = await createNgrokUrl();
  const StreamingService = getStreamingService();
  const streamingService = await StreamingService({ ngrokUrl, app });
  const music = Music();
  const kofi = KoFi({ ngrokUrl, app });

  kofi.on("payment", ({ type, isAnonymous, user }) => {
    if (type === "Donation") {
      sendAlertToClient({ type: "donation", user, isAnonymous });
      const userName = isAnonymous ? "bill gates" : user.username;
      streamingService.chat.sendMessage(
        `hi ${userName}, thanks for the donation!`
      );
    }
  });

  async function detectFacesSendToClient() {
    try {
      const image = await obs.getWebcamImage();

      const faceDetection = await detectFaces(image);

      if (!faceDetection) {
        throw new Error("No face detected");
      }

      io.emit("data", { faceDetection });
    } catch (e) {
      // didn't work
    }
  }

  obs.sourceVisibilityTriggers({
    "Joycon: A": async () => {
      return obs.toggleFilter({
        source: "Raw Webcam",
        filter: "Webcam: Recursion Effect",
      });
    },
    "Joycon: B": async () => {
      return obs.toggleFilter({
        source: "Raw Webcam",
        filter: "Webcam: Time Warp Scan",
      });
    },
    "Joycon: Y": async () => {
      return obs.toggleFilter({
        source: "Raw Webcam",
        filter: "Webcam: Trail",
      });
    },
    "Joycon: X": async () => {
      await obs.switchToScene("Dance");
    },
    "Joycon: Right Shoulder": async () => {
      await obs.switchToScene("Dance Multiple");
    },
    "Joycon: Right Trigger": async () => {
      await obs.switchToScene("Dance everywhere");
    },
    "Joycon: Right Analog In": async () => {
      return obs.toggleFilter({
        source: "Raw Webcam",
        filter: "Webcam: Rainbow",
      });
    },
    "Scene change: BRB": async () => switchToBRBScene(),
    "Stop Goosebumps": async () => {
      io.emit("data", { goosebumpsBookTitle: null });
      CURRENT_GOOSEBUMP_BOOK = null;
      await obs.switchToScene("Main Bigger Zac");
    },
  });

  obs.filterVisibilityTriggers({
    "TONOR Microphone": {
      "Mic: Deep Voice": async ({ isVisible }) => {
        return await obs.showHideSource({
          scene: "Overlays",
          source: "MIDI: Bass Spin",
          isVisible,
        });
      },
      "Mic: Delay": async ({ isVisible }) => {
        return await obs.showHideSource({
          scene: "Overlays",
          source: "MIDI: Echo",
          isVisible,
        });
      },
      "Mic: Auto-Loop": async ({ isVisible }) => {
        return await obs.showHideSource({
          scene: "Overlays",
          source: "MIDI: Auto-loop",
          isVisible,
        });
      },
    },
  });

  // set and update channel info
  CURRENT_CHANNEL_INFO = await streamingService.getChannelInfo();
  streamingService.on("channelInfo", async (channelInfo) => {
    logger.info("🤖 Streaming Tools", "Updating channel info");
    CURRENT_CHANNEL_INFO = channelInfo;
  });

  try {
    GOOGLE_SHEET_COMMANDS = await googleSheetCommands.getCommands();
    const scheduledCommands =
      await googleSheetCommands.getScheduledCommands();
    scheduledCommands.forEach((scheduledCommand) => {
      logger.info(
        "🤖 Streaming Tools",
        `Running !${scheduledCommand.name} ${scheduledCommand.schedule}`
      );
      schedule(scheduledCommand.schedule, () => {
        streamingService.chat.sendMessage(scheduledCommand.value);
      });
    });
  } catch (e) {
    logger.info(
      "🤖 Streaming Tools",
      "Couldn't run scheduled commands"
    );
  }

  streamingService.on("subscribe", (data) => {
    sendAlertToClient({ type: "subscribe", ...data });

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

  streamingService.on("bits", (data) => {
    sendAlertToClient({ type: "bits", ...data });
    const userName = data.isAnonymous
      ? "bill gates"
      : `@${data.user.username}`;
    streamingService.chat.sendMessage(
      `hi ${userName}, thanks for the bits!`
    );
  });

  streamingService.on("follow", async (user) => {
    if (PAUSE_FOLLOW_ALERT) {
      return;
    }

    sendAlertToClient({ type: "follow", user });
    streamingService.chat.sendMessage(
      `hi @${user.username}, thanks for following!`
    );

    // update follow total
    const followTotal = await streamingService.getFollowTotal();
    io.emit("data", { followTotal });
  });

  streamingService.on("raid", async (user) => {
    if (user.viewers > 50) {
      PAUSE_FOLLOW_ALERT = true;
      streamingService.chat.sendMessage(
        "big raid, follow alerts paused for 5 mins"
      );
      setTimeout(() => {
        PAUSE_FOLLOW_ALERT = false;
        streamingService.chat.sendMessage(
          "follow alerts will happen again chief"
        );
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
    streamingService.chat.sendMessage(
      `hi @${user.username}, thanks for the raid! hi to the ${user.viewers} raiders.`
    );
  });

  streamingService.on(
    "channelPointRewardUnfulfilled",
    async ({ reward }) => {
      const { title } = reward;

      if (!title) {
        return;
      }

      if (title === "big drink") {
        await obs.showSource({
          scene: "Overlays",
          source: "Amelia Water Loop",
        });
      }
    }
  );

  streamingService.on(
    "channelPointRewardCancelled",
    async ({ reward }) => {
      const { title } = reward;

      if (!title) {
        return;
      }

      if (title === "big drink") {
        await obs.hideSource({
          scene: "Overlays",
          source: "Amelia Water Loop",
        });
      }
    }
  );

  async function danceWithMe(username) {
    const newDancer = await streamingService.getUser(username);
    newDancer.id = randomID();
    CURRENT_DANCERS.push(newDancer);

    io.emit("data", { dancers: CURRENT_DANCERS });

    setTimeout(() => {
      // remove from array
      CURRENT_DANCERS = CURRENT_DANCERS.filter((dancer) => {
        dancer.id !== newDancer.id;
      });
      io.emit("data", { dancers: CURRENT_DANCERS });
    }, 1000 * 60 * 3 + 5000); // 2 minutes (+ wait for it to fade out on client)
  }

  streamingService.on(
    "channelPointRewardFulfilled",
    async ({ reward, user }) => {
      const { title } = reward;
      const { message } = user;

      if (!title) {
        return;
      }

      if (title === "dance with zac") {
        await danceWithMe(user.username);
      }

      if (title === "pog") {
        turnOnOverlay("Steve Pointing Group", 9 * 1000);
        streamingService.chat.sendMessage(
          "thanks twitch.tv/blgsteve for the pog audit"
        );
      }

      if (title === "big drink") {
        await obs.hideSource({
          scene: "Overlays",
          source: "Amelia Water Loop",
        });

        streamingService.chat.sendMessage(
          "Shout out to twitch.tv/ameliabayler the water singer"
        );
      }

      if (title === "show your pride") {
        const inputPrideFlagName = message;

        if (inputPrideFlagName === "straight") {
          const { username } = user;
          streamingService.chat.sendMessage(
            "Ok mate... straight pride doesn't exist."
          );
          streamingService.chat.timeout({
            username,
            lengthSeconds: 60,
            reason: "Trying to chat shit about straight pride",
          });
          return;
        }

        const prideFlag = getPrideFlag(inputPrideFlagName);

        if (prideFlag) {
          CURRENT_PRIDE_FLAG_NAME = prideFlag.name;
          setLightsToPrideFlag(prideFlag.name);
          io.emit("data", { prideFlagName: prideFlag.name });
          if (prideFlag.twitchEmote) {
            streamingService.chat.sendMessage(
              `${prideFlag.twitchEmote} `.repeat(5)
            );
          }
        } else {
          const randomPrideFlagName = getRandomPrideFlag().name;
          streamingService.chat.sendMessage(
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
          logger.error("🐝 Imma bee", JSON.stringify(e));
          streamingService.chat.sendMessage(
            `Couldn't find Zac's face...`
          );
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
        turnOnOverlay("Star Trek Space Video", 103 * 1000);
        setTimeout(() => {
          turnOnOverlay("Star Trek Slideshow", 53 * 1000);
          streamingService.chat.sendMessage(
            `hip hop star trek by d-train https://www.youtube.com/watch?v=oTRKrzgVe6Y`
          );
        }, 50 * 1000); // minute into the video
      }

      if (title === "snowball") {
        logger.log("❄ Snowball", "Triggered...");
        await detectFacesSendToClient();
        sendAlertToClient({ type: "penguin-throw" });
      }

      if (title === "barry") {
        logger.log(" Barry", "Triggered...");
        turnOnOverlay("Barry Singing", 104 * 1000);
      }

      if (title === "BroomyJagRace") {
        logger.log("🚗 BroomyJagRace", "Triggered...");
        turnOnOverlay("BroomyJagRace");
      }

      if (title === "goosebumpz book") {
        logger.log("📚 Goosebumps Book", "Triggered...");
        try {
          const { bookTitle } = await createGoosebumpsBookImage(
            message
          );
          io.emit("data", { goosebumpsBookTitle: bookTitle });
          CURRENT_GOOSEBUMP_BOOK = bookTitle;
          await obs.switchToScene("Goosebumps");
        } catch (e) {
          logger.error("📚 Goosebumps Book", e);
          streamingService.chat.sendMessage(
            `Couldn't generate a book for ${message}`
          );
          CURRENT_GOOSEBUMP_BOOK = null;
        }
      }
    }
  );

  streamingService.chat.on(
    "message",
    async ({
      id,
      isMod,
      isBroadcaster,
      message,
      messageWithEmotes,
      command,
      commandArguments,
      user,
      tokens = [],
    }) => {
      if (command === "dance") {
        await danceWithMe(user.username);
      }

      if (command === "song" || command === "music") {
        const currentTrack = await music.getCurrentTrack();

        if (!currentTrack || !currentTrack.isNowPlaying) {
          streamingService.chat.sendMessage(
            `SingsNote Nothing is playing...`
          );
          return;
        }

        const { artistName, trackName, albumName, trackUrl } =
          currentTrack;

        if (!artistName || !trackName || !albumName) {
          streamingService.chat.sendMessage(
            `SingsNote Nothing is playing...`
          );
          return;
        }

        streamingService.chat.sendMessage(
          `SingsNote ${trackName} — ${artistName} — ${albumName} ${trackUrl}`.trim()
        );
      }

      const bexTalksForFirstTime =
        (!BEX_HAS_TALKED &&
          user &&
          user.username.toLowerCase() === "bexchat") ||
        (!BEX_HAS_TALKED &&
          IS_GLIMESH &&
          user &&
          user.username.toLowerCase() === "bex");
      const bexCommandUsed =
        command === "bex" || command === "bexchat";
      if (bexTalksForFirstTime) {
        BEX_HAS_TALKED = true;
      }
      if (bexTalksForFirstTime || bexCommandUsed) {
        await detectFacesSendToClient();
        sendAlertToClient({ type: "bexchat" });
      }

      if (
        (!STEVE_HAS_TALKED &&
          user &&
          user.username.toLowerCase() === "blgsteve") ||
        (IS_GLIMESH &&
          !STEVE_HAS_TALKED &&
          user &&
          user.username.toLowerCase() === "bigsteve")
      ) {
        STEVE_HAS_TALKED = true;
        turnOnOverlay("octopussy", 12 * 1000);
      }
      if (command === "steve") {
        turnOnOverlay("octopussy", 12 * 1000);
      }

      if (command === "2020") {
        sendAlertToClient({ type: "fuck-2020" });
      }

      if (command === "game" || command === "category") {
        const { categoryName } = CURRENT_CHANNEL_INFO;
        if (categoryName) {
          if (categoryName === "Just Chatting") {
            streamingService.chat.sendMessage(
              `zac's farting about chatting`
            );
          } else if (categoryName === "Makers & Crafting") {
            streamingService.chat.sendMessage(
              `zac's making something`
            );
          } else {
            streamingService.chat.sendMessage(
              `zac's playing ${categoryName}`
            );
          }
        } else {
          streamingService.chat.sendMessage(
            `zac isn't doing anything... fuck all`
          );
        }
      }

      if (command === "title") {
        if (CURRENT_CHANNEL_INFO.title) {
          streamingService.chat.sendMessage(
            `stream title is "${CURRENT_CHANNEL_INFO.title}"`
          );
        } else {
          streamingService.chat.sendMessage(
            `there is no stream title`
          );
        }
      }

      const chatCommand = GOOGLE_SHEET_COMMANDS.find(
        ({ name }) => command === name
      );
      if (chatCommand) {
        streamingService.chat.sendMessage(chatCommand.value);
      }

      // the mod/broadcaster zooone
      if (isMod || isBroadcaster) {
        if (command === "commands-update") {
          GOOGLE_SHEET_COMMANDS =
            await googleSheetCommands.getCommands();
        }

        if (command === "sign" || command === "alert") {
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

        if (command === "delete") {
          POPUP_MESSAGE = "";
          io.emit("data", { popUpMessage: "" });
        }

        if (command === "deletebook") {
          io.emit("data", { goosebumpsBookTitle: null });
          CURRENT_GOOSEBUMP_BOOK = null;
          await obs.switchToScene("Main Bigger Zac");
        }

        if (command === "follows") {
          if (PAUSE_FOLLOW_ALERT) {
            PAUSE_FOLLOW_ALERT = false;
            streamingService.chat.sendMessage(
              "follow alerts will happen again now phew"
            );
          } else {
            PAUSE_FOLLOW_ALERT = true;
            streamingService.chat.sendMessage(
              "follow alerts paused for 5 mins"
            );
            setTimeout(() => {
              PAUSE_FOLLOW_ALERT = false;
              streamingService.chat.sendMessage(
                "follow alerts will happen again"
              );
            }, 5 * 60 * 1000); // after 5 minutes resume again
          }
        }

        if (command === "say") {
          sendAlertToClient({
            type: "say",
            message: commandArguments,
            messageWithEmotes: messageWithEmotes
              .replace("!say", "")
              .trim(),
          });
        }

        if (command === "brb") {
          await switchToBRBScene();
        }

        if (command === "title") {
          const newTitle = commandArguments;
          if (!newTitle) {
            return;
          }

          try {
            await streamingService.setChannelInfo({
              title: newTitle,
            });
          } catch (e) {
            streamingService.chat.sendMessage(e.message);
          }
        }

        if (command === "test-follow") {
          sendAlertToClient({
            type: "follow",
            user: { username: "ninja" },
          });
        }

        if (
          command === "so" ||
          command === "shoutout" ||
          command === "shout-out"
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

          const shoutOutUser = await streamingService.getUser(
            shoutOutUsername
          );

          if (!shoutOutUser) {
            return;
          }

          let nameAudioUrl;
          try {
            nameAudioUrl = await textToSpeech(shoutOutUser.username);
          } catch (e) {
            // couldnt get name audio
          }

          const customShoutOuts =
            await streamingService.getCustomShoutOuts();
          const customShoutOut = customShoutOuts.find(
            (shoutOut) =>
              shoutOut.username ===
              shoutOutUser.username.toLowerCase()
          );

          sendAlertToClient({
            type: "shout-out",
            user: shoutOutUser,
            loadImage: shoutOutUser.image,
            customShoutOut,
            audioUrl: nameAudioUrl,
          });

          if (IS_GLIMESH) {
            const urlString = `https://glimesh.tv/${shoutOutUser.username.toLowerCase()}`;
            streamingService.chat.sendMessage(
              `:zactopog: shout out to ${shoutOutUser.username} at ${urlString} :zactopog:`
            );
            return;
          }

          let nameString;
          if (customShoutOut) {
            nameString = customShoutOut.message;
          } else if (shoutOutUser.pronouns) {
            nameString = `${shoutOutUser.username} (${shoutOutUser.pronouns})`;
          } else {
            nameString = shoutOutUser.username;
          }

          const urlString = `twitch.tv/${shoutOutUser.username.toLowerCase()}`;

          streamingService.chat.sendMessage(
            `shout out to ${nameString} doing something cool over at ${urlString} Squid1 Squid2 zactopUs Squid2 Squid4`
          );
        }
      }

      if (IS_GLIMESH) {
        const hasMonkasEmote = tokens.some((token) => {
          return (
            token.type === "emote" && token.text === ":glimmonkas:"
          );
        });
        if (hasMonkasEmote) {
          streamingService.chat.deleteMessage(id);
          streamingService.chat.sendMessage(
            `@${user.username} no pepes please`
          );
        }
      }

      io.emit("data", {
        message,
        messageWithEmotes,
      });
    }
  );

  music.on("track", (track) => {
    io.emit("data", { track });
  });

  io.on("connection", async (socket) => {
    logger.info("👽 Stream Client", "Connected");

    const followTotal = await streamingService.getFollowTotal();
    const currentTrack = await music.getCurrentTrack();
    io.emit("data", {
      track: currentTrack,
      followTotal,
      popUpMessage: POPUP_MESSAGE,
      goosebumpsBookTitle: CURRENT_GOOSEBUMP_BOOK,
      prideFlagName: CURRENT_PRIDE_FLAG_NAME,
      dancers: CURRENT_DANCERS,
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
