const fetch = require("node-fetch");
const cache = require("memory-cache");
const replaceAll = require("replaceall");

const { TWITCH_BROADCASTER_ID } = process.env;

const CACHE_KEY = "BETTER_TTV_EMOTES";
const CACHE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

async function getBetterTTVEmotes() {
  const response = await fetch(
    `https://api.betterttv.net/3/cached/users/twitch/${TWITCH_BROADCASTER_ID}`
  );
  const json = await response.json();

  return [...json.channelEmotes, ...json.sharedEmotes].map(
    (emote) => ({
      type: "betterttv",
      id: emote.id,
      image: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
      code: emote.code,
    })
  );
}

async function getCachedBetterTTVEmotes() {
  const cachedBetterTTVEmotes = cache.get(CACHE_KEY);
  if (cachedBetterTTVEmotes) {
    return cachedBetterTTVEmotes;
  }

  const betterTTVEmotes = await getBetterTTVEmotes();

  cache.put(CACHE_KEY, betterTTVEmotes, CACHE_TIMEOUT_MS);

  return betterTTVEmotes;
}

function getTwitchEmotes(text, emotes) {
  if (!emotes || Object.keys(emotes).length === 0) {
    return [];
  }

  const emotePositions = [];

  Object.keys(emotes).forEach((emoteId) => {
    const emoteStringPositions = emotes[emoteId];

    const [emoteStringPosition] = emoteStringPositions;

    if (typeof emoteStringPosition !== "string") {
      return;
    }

    const [emoteStartPositionString, emoteEndPositionString] =
      emoteStringPosition.split("-");
    const emoteStartPosition = parseInt(emoteStartPositionString, 10);
    const emoteEndPosition = parseInt(emoteEndPositionString, 10);

    const emoteText = text.substring(
      emoteStartPosition,
      emoteEndPosition + 1
    );

    emotePositions.push({
      type: "twitch",
      id: emoteId,
      image: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`,
      code: emoteText,
    });
  });

  return emotePositions;
}

function replaceEmotes(text, emotes) {
  if (!emotes || emotes.length === 0) {
    return text;
  }

  let replacedText = `${text} `; // add some padding to right
  emotes.forEach(({ type, image, code }) => {
    // adding padding so we don't replace emote code inside of text
    const paddedCode = ` ${code} `;
    const emoteImageElement = ` <img class="emote emote--${type}" src="${image}" alt="${code}" /> `;

    replacedText = replaceAll(
      paddedCode,
      emoteImageElement,
      replacedText
    );
  });

  return replacedText.trim();
}

async function replaceTextWithEmotes(text, emoteDataFromTwitchBot) {
  if (!text || text.length === 0) {
    return "";
  }

  const betterTTVEmotes = await getCachedBetterTTVEmotes();
  const twitchEmotes = getTwitchEmotes(text, emoteDataFromTwitchBot);
  const emotes = [...twitchEmotes, ...betterTTVEmotes];

  return replaceEmotes(text, emotes);
}

module.exports = replaceTextWithEmotes;
