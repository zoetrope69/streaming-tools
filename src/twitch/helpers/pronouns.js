const fetch = require("node-fetch");
const cache = require("memory-cache");

const BASE_API_ENDPOINT = "https://pronouns.alejo.io/api";

const CACHE_KEY = "PRONOUNS";
const CACHE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

let PRONOUNS = [];

async function callAPI(endpoint) {
  const response = await fetch(`${BASE_API_ENDPOINT}${endpoint}`, {
    method: "GET",
    headers: {
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-GB,en;q=0.5",
      Connection: "keep-alive",
      DNT: 1,
      Host: "pronouns.alejo.io",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    },
  });
  const json = await response.json();
  return json;
}

async function getAvailablePronouns() {
  return callAPI("/pronouns");
}

async function getUserPronounsData(username = "") {
  return callAPI(`/users/${username.toLowerCase()}`);
}

async function getCachedUserPronounsData(username) {
  const cacheKey = `${CACHE_KEY}_${username}`;
  const cachedUserPronoun = cache.get(cacheKey);
  if (cachedUserPronoun) {
    return cachedUserPronoun;
  }

  const userPronouns = await getUserPronounsData(username);

  cache.put(cacheKey, userPronouns, CACHE_TIMEOUT_MS);

  return userPronouns;
}

async function getUserPronouns(username) {
  const [userPronounData] = await getCachedUserPronounsData(username);

  const pronoun = PRONOUNS.find((pronoun) => {
    return pronoun.name === userPronounData?.pronoun_id;
  });

  if (!pronoun) {
    return null;
  }

  return pronoun.display.toLowerCase();
}

// on file load get current pronouns available
getAvailablePronouns().then((pronouns) => {
  PRONOUNS = pronouns;
});

module.exports = getUserPronouns;
