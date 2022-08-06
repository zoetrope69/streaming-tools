import fetch from "node-fetch";
import cache from "memory-cache";

import Logger from "../../helpers/logger.js";
const logger = new Logger("🏷 Twitch Pronouns");

const BASE_API_ENDPOINT = "https://pronouns.alejo.io/api";

const CACHE_KEY = "PRONOUNS";
const CACHE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_AVAILABLE_PRONOUNS_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 1 day

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

let getAvailablePronounsRequestAttempts = 0;
async function getAvailablePronouns() {
  getAvailablePronounsRequestAttempts += 1;

  if (getAvailablePronounsRequestAttempts > 5) {
    throw new Error("Couldn't get pronouns");
  }

  let pronouns;
  try {
    pronouns = await callAPI("/pronouns");
  } catch (e) {
    logger.error("Couldn't get pronouns trying again...");
    return getAvailablePronouns();
  }

  return pronouns;
}

async function getCachedAvailablePronouns() {
  const cacheKey = `${CACHE_KEY}_AVAILABLE_PRONOUNS`;
  const cachedAvailablePronouns = cache.get(cacheKey);
  if (cachedAvailablePronouns) {
    return cachedAvailablePronouns;
  }

  let availablePronouns = [];

  try {
    availablePronouns = await getAvailablePronouns();

    cache.put(
      cacheKey,
      availablePronouns,
      CACHE_AVAILABLE_PRONOUNS_TIMEOUT_MS
    );
  } catch (e) {
    logger.error(e.message || e);
  }

  return availablePronouns;
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
  const availablePronouns = await getCachedAvailablePronouns();
  const [userPronounData] = await getCachedUserPronounsData(username);
  const pronoun = availablePronouns.find((pronoun) => {
    return pronoun.name === userPronounData?.pronoun_id;
  });

  if (!pronoun) {
    return null;
  }

  return pronoun.display.toLowerCase();
}

export default getUserPronouns;
