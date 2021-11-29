import { EventEmitter } from "events";
import TwitchAPI from "./twitch-api.js";
import TwitchEventSub from "./twitch-eventsub.js";
import TwitchBot from "./twitch-bot.js";
import twitchShoutOuts from "./helpers/shout-outs.js";

async function Twitch({ ngrokUrl, app }) {
  const eventEmitter = new EventEmitter();

  const twitchApi = await TwitchAPI({ ngrokUrl });
  await TwitchEventSub({
    app,
    twitchApi,
    eventEmitter,
  });
  const { chat } = await TwitchBot({ eventEmitter });

  return Object.assign(eventEmitter, {
    ...twitchApi,
    getCustomShoutOuts: twitchShoutOuts,
    chat,
  });
}

export default Twitch;
