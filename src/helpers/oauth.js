// get process.env from .env
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";

import cache from "memory-cache";
import { stringify as queryStringStringify } from "qs";
import enquirer from "enquirer";
import fetch from "node-fetch";

import importJSON from "./import-json.js";
import Logger from "./logger.js";
const logger = new Logger("🔃 OAuth");

const REFRESH_TOKEN_PATH = new URL(
  "../../refresh-tokens.json",
  import.meta.url
);

let refreshTokens = await importJSON(REFRESH_TOKEN_PATH);

const BASE_CACHE_KEY = "OAUTH";

const {
  SPOTIFY_OAUTH_REDIRECT_URI,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,

  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  TWITCH_OAUTH_SECRET,

  NGROK_URL,
} = process.env;

const TYPES = {
  spotify: {
    clientId: SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY_CLIENT_SECRET,
    apiTokenEndpoint: "https://accounts.spotify.com/api/token",
    authoriseEndpoint: "https://accounts.spotify.com/authorize",
    redirectURI: SPOTIFY_OAUTH_REDIRECT_URI,
    scopes: [
      "user-read-currently-playing",
      "user-read-playback-state",
      "user-modify-playback-state",
    ],
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  },
  twitch: {
    clientId: TWITCH_CLIENT_ID,
    clientSecret: TWITCH_CLIENT_SECRET,
    apiTokenEndpoint: "https://id.twitch.tv/oauth2/token",
    authoriseEndpoint: "https://id.twitch.tv/oauth2/authorize",
    redirectURI: `${NGROK_URL}/twitch`,
    state: TWITCH_OAUTH_SECRET,
    scopes: [
      "user:edit:broadcast",
      "bits:read", // bits
      "channel:read:subscriptions", // subbies
      "channel:read:redemptions", // 	view Channel Points custom rewards and their redemptions on a channel
      "channel:manage:redemptions", // 	manage channel redemptions
      "channel:manage:broadcast", // modifies channel information for users
    ],
    headers: {
      Accept: "application/vnd.twitchtv.v5+json",
    },
  },
  "twitch-app": {
    useClientCredentials: true,
    clientId: TWITCH_CLIENT_ID,
    clientSecret: TWITCH_CLIENT_SECRET,
    apiTokenEndpoint: "https://id.twitch.tv/oauth2/token",
    authoriseEndpoint: "https://id.twitch.tv/oauth2/authorize",
    redirectURI: `${NGROK_URL}/twitch`,
    scopes: [
      "user:edit:broadcast",
      "bits:read", // bits
      "channel:read:subscriptions", // subbies
      "channel:read:redemptions", // 	view Channel Points custom rewards and their redemptions on a channel
      "channel:manage:broadcast", // modifies channel information for users
    ],
    headers: {
      Accept: "application/vnd.twitchtv.v5+json",
    },
  },
};

function updateRefreshToken(key, refreshToken) {
  const json = { ...refreshTokens, [key]: refreshToken };
  const jsonString = JSON.stringify(json, null, 2);

  try {
    fs.writeFileSync(REFRESH_TOKEN_PATH, jsonString);
  } catch (error) {
    logger.error(error);

    // don't update refreshTokens return the old ones
    return refreshTokens;
  }

  refreshTokens = json;
  return jsonString;
}

function createAuthURL({ type }) {
  const {
    clientId,
    redirectURI,
    scopes,
    authoriseEndpoint,
    state,
    access_type,
    approval_prompt,
  } = TYPES[type];

  const queryString = queryStringStringify({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectURI,
    scope: scopes.join(" ").trim(),
    state,
    access_type,
    approval_prompt,
  });

  return `${authoriseEndpoint}?${queryString}`;
}

async function getAuthCodeFromCommandLineUrl({ type }) {
  const { state: existingState } = TYPES[type];

  const response = await enquirer.prompt({
    type: "input",
    name: "url",
    message: "Redirected URL",
  });

  if (response.url.trim().length === 0) {
    throw new Error("No URL sent");
  }

  let url;
  try {
    url = new URL(response.url);
  } catch (e) {
    throw new Error("Invalid URL");
  }
  const code = url.searchParams.get("code");

  if (!code) {
    throw new Error("No code in URL");
  }

  const state = url.searchParams.get("state");
  if (state !== existingState) {
    throw new Error(`Invalid state: "${state}"`);
  }

  return code;
}

async function getAuthManually({ type }) {
  logger.info(`⚠ Can't authorize "${type}"`);
  // eslint-disable-next-line no-console
  console.log(createAuthURL({ type }));

  const authCode = await getAuthCodeFromCommandLineUrl({ type });

  const response = await getAuth({ authCode, type });

  if (response.error) {
    logger.error(response);
    throw new Error(response.error_description);
  }

  if (!response.refresh_token) {
    logger.error(response);
    throw new Error("No refresh token...");
  }

  return response;
}

async function getClientCredentialsAuth({ type }) {
  const {
    clientId,
    clientSecret,
    apiTokenEndpoint,
    headers,
    scopes,
  } = TYPES[type];

  const response = await fetch(apiTokenEndpoint, {
    method: "POST",
    headers,
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: scopes.join(" ").trim(),
      grant_type: "client_credentials",
    }),
  });

  if (response.status !== 200) {
    throw new Error(response.statusText);
  }

  return response.json();
}

async function getAuth({ authCode, type }) {
  const {
    clientId,
    clientSecret,
    apiTokenEndpoint,
    redirectURI,
    headers,
    scopes,
  } = TYPES[type];

  const response = await fetch(apiTokenEndpoint, {
    method: "POST",
    headers,
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: scopes.join(" ").trim(),
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: redirectURI,
    }),
  });

  if (response.status !== 200) {
    throw new Error(response.statusText);
  }

  return response.json();
}

async function getAuthWithRefreshToken({ type }) {
  const refreshToken = refreshTokens[type];
  const {
    clientId,
    clientSecret,
    scopes,
    apiTokenEndpoint,
    headers,
  } = TYPES[type];

  const response = await fetch(apiTokenEndpoint, {
    method: "POST",
    headers,
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: scopes.join(" ").trim(),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (response.status !== 200) {
    throw new Error(response.statusText);
  }

  return response.json();
}

async function getAccessToken({ type }) {
  let response;

  if (TYPES[type].useClientCredentials) {
    response = await getClientCredentialsAuth({ type });
  } else {
    try {
      response = await getAuthWithRefreshToken({ type });
    } catch (e) {
      logger.error(e.message);

      response = await getAuthManually({ type });
    }
  }

  if (response.error) {
    if (response.error === "invalid_grant") {
      response = await getAuthManually({ type });
    } else {
      throw new Error(
        `${response.error} ${response.error_description}`
      );
    }
  }

  if (response.refresh_token) {
    updateRefreshToken(type, response.refresh_token);
  }

  const { access_token, expires_in } = response;

  return { accessToken: access_token, expiresIn: expires_in };
}

async function getCachedAccessToken({ type }) {
  const cacheKey = `${BASE_CACHE_KEY}-${type}`;
  const cachedAccessToken = cache.get(cacheKey);

  if (cachedAccessToken) {
    return { accessToken: cachedAccessToken };
  }

  const { accessToken, expiresIn } = await getAccessToken({ type });

  cache.put(cacheKey, accessToken, expiresIn);

  return { accessToken };
}

export default getCachedAccessToken;
