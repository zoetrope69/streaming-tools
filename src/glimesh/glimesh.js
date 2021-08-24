require("dotenv").config();

const { EventEmitter } = require("events");

const GlimeshAPI = require("./glimesh-api");
const GlimeshEvents = require("./glimesh-events");

const logger = require("../helpers/logger");

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
    logger.info("💎 Glimesh", "Bot connected");
  });

  // debug testing
  eventEmitter.on("follow", (user) => {
    logger.info("✅ Glimesh User Followed", user);
  });

  return Object.assign(eventEmitter, glimeshAPI, {
    chat,
  });
}

module.exports = Glimesh;
