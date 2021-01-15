const fetch = require("node-fetch");
const cache = require("memory-cache");

const CACHE_KEY = "TWITCH_SHOUT_OUTS";
const CACHE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

async function getShoutOuts() {
  const response = await fetch("https://pastebin.com/raw/0yhD0h01");
  const text = await response.text();

  const lines = text.split("\n");
  const validLines = lines.filter((line) => line.startsWith(":["));

  const shoutOuts = validLines.map((validLine) => {
    const usernameStartString = ":[";
    const usernameEndString = "]";
    const usernameStartPosition = validLine.indexOf(
      usernameStartString
    );

    const usernameEndPosition = validLine.indexOf(usernameEndString);
    const username = validLine
      .substring(
        usernameStartPosition + usernameStartString.length,
        usernameEndPosition
      )
      .toLowerCase();
    const message = validLine
      .substring(usernameEndPosition + usernameEndString.length)
      .trim();
    return { username, message };
  });

  return shoutOuts;
}

async function getCachedShoutOuts() {
  const cachedShoutOuts = cache.get(CACHE_KEY);
  if (cachedShoutOuts) {
    return cachedShoutOuts;
  }

  const shoutOuts = await getShoutOuts();

  cache.put(CACHE_KEY, shoutOuts, CACHE_TIMEOUT_MS);

  return shoutOuts;
}

module.exports = getCachedShoutOuts;
