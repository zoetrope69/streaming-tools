import { EventEmitter } from "events";
import TwitchAPI from "./twitch-api.js";
import TwitchEventSub from "./twitch-eventsub.js";
import TwitchBot from "./twitch-bot.js";

async function Twitch({ ngrokUrl, app }) {
  const eventEmitter = new EventEmitter();

  // default is 10 lets allow for more
  eventEmitter.setMaxListeners(100);

  const twitchBot = await TwitchBot({ eventEmitter });
  const twitchApi = await TwitchAPI({ ngrokUrl, twitchBot });
  TwitchEventSub({
    app,
    twitchApi,
    eventEmitter,
  });

  return Object.assign(eventEmitter, {
    ...twitchApi,
    chat: twitchBot,
  });
}

export default Twitch;
