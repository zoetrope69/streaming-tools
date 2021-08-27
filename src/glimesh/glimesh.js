require("dotenv").config();

const { EventEmitter } = require("events");

const GlimeshAPI = require("./glimesh-api");
const GlimeshEvents = require("./glimesh-events");

const Logger = require("../helpers/logger");
const logger = new Logger("▶️ Glimesh");

async function Glimesh() {
  const eventEmitter = new EventEmitter();

  const glimeshAPI = await GlimeshAPI();

  const moderators = await glimeshAPI.getModerators();
  const accessToken = await glimeshAPI.getAccessToken();
  const { follows, chat } = await GlimeshEvents({
    accessToken,
    moderators,
  });

  // move this event to the main glimesh to match twitch
  follows.on("follow", (data) => {
    eventEmitter.emit("follow", data);
  });

  chat.on("join", () => {
    logger.info("Bot connected");
  });

  // debug testing
  eventEmitter.on("follow", (user) => {
    logger.log(user);
  });

  return Object.assign(eventEmitter, glimeshAPI, {
    chat,
  });
}

module.exports = Glimesh;
