const { EventEmitter } = require("events");
const TwitchAPI = require("./twitch-api");
const TwitchEventSub = require("./twitch-eventsub");
const TwitchBot = require("./twitch-bot");
const twitchShoutOuts = require("./helpers/shout-outs");

async function Twitch({ ngrokUrl, app }) {
  const eventEmitter = new EventEmitter();

  const twitchApi = await TwitchAPI({ ngrokUrl });
  await TwitchEventSub({
    app,
    twitchApi,
    eventEmitter,
  });
  const { bot } = await TwitchBot({ eventEmitter });

  return Object.assign(eventEmitter, {
    ...twitchApi,
    getCustomShoutOuts: twitchShoutOuts,
    bot,
  });
}

module.exports = Twitch;
