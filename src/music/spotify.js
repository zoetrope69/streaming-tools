const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { stringify: queryStringStringify } = require("qs");
const { prompt } = require("enquirer");
const cache = require("memory-cache");

const logger = require("../helpers/logger");

const REFRESH_TOKEN_PATH = path.join(
  __dirname,
  "/../../spotify-refresh-token.json"
);

const BASE_URL = "https://api.spotify.com/v1";
const {
  SPOTIFY_AUTH_REDIRECT_URI,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
} = process.env;

const SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
];

const CACHE_KEY = "SPOTIFY";

let {
  refreshToken: SPOTIFY_REFRESH_TOKEN,
} = require(REFRESH_TOKEN_PATH);

function saveRefreshTokenToFile(refreshToken) {
  SPOTIFY_REFRESH_TOKEN = refreshToken;
  const jsonString = JSON.stringify({ refreshToken }, null, 2);
  fs.writeFile(REFRESH_TOKEN_PATH, jsonString, (error) => {
    if (error) {
      return logger.error("🎶 Spotify", error);
    }
  });
}

function getAuthorizationHeaderValue() {
  const base64IdAndSecret = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
  return `Basic ${base64IdAndSecret}`;
}

function createAuthURL() {
  const queryString = queryStringStringify({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: "https://zac.land/callback",
    scope: SCOPES.join(" ").trim(),
  });
  return `https://accounts.spotify.com/authorize?${queryString}`;
}

async function getAuthCodeFromCommandLineUrl() {
  const response = await prompt({
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

  return code;
}

async function getAuthManually() {
  logger.info(
    "🎶 Spotify",
    "⚠ Can't authorize Spotify, go and update SPOTIFY_AUTH_TOKEN from this URL:"
  );
  logger.info("🎶 Spotify", createAuthURL());

  const authCode = await getAuthCodeFromCommandLineUrl();

  const response = await getAuth(authCode);

  if (response.error) {
    throw new Error(response.error_description);
  }

  if (!response.refresh_token) {
    throw new Error("No refresh token...");
  }

  return response;
}

async function getAuth(code) {
  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        Authorization: getAuthorizationHeaderValue(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_AUTH_REDIRECT_URI,
      }),
    }
  );

  if (response.status !== 200) {
    throw new Error(response.statusText);
  }

  return response.json();
}

async function getAuthWithRefreshToken(refreshToken) {
  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        Authorization: getAuthorizationHeaderValue(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    }
  );

  if (response.status !== 200) {
    throw new Error(response.statusText);
  }

  return response.json();
}

async function getAccessToken() {
  let response = await getAuthWithRefreshToken(SPOTIFY_REFRESH_TOKEN);

  if (response.error) {
    if (response.error === "invalid_grant") {
      response = await getAuthManually();
    } else {
      throw new Error(response.error_description);
    }
  }

  if (response.refresh_token) {
    saveRefreshTokenToFile(response.refresh_token);
  }

  const { access_token, expires_in } = response;

  return { accessToken: access_token, expiresIn: expires_in };
}

async function getCachedAccessToken() {
  const cachedAccessToken = cache.get(CACHE_KEY);

  if (cachedAccessToken) {
    return { accessToken: cachedAccessToken };
  }

  const { accessToken, expiresIn } = await getAccessToken();

  cache.put(CACHE_KEY, accessToken, expiresIn);

  return { accessToken };
}

async function callEndpoint(
  endpoint,
  queryParams = {},
  options = {}
) {
  const { accessToken } = await getCachedAccessToken();

  const queryString = queryStringStringify({
    market: "GB",
    ...queryParams,
  });

  const response = await fetch(
    `${BASE_URL}${endpoint}?${queryString}`,
    {
      method: options.method || "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  // No Content
  if (response.status === 204) {
    return {};
  }

  if (response.status !== 200) {
    throw new Error(response.statusText);
  }

  const json = await response.json();

  if (json.error) {
    throw new Error(json.error.message);
  }

  return json;
}

async function getAlbumArtURL(id) {
  const { images } = await callEndpoint(`/albums/${id}`);

  if (!images || images.length === 0) {
    return;
  }

  return images.find((image) => image.width === 300)?.url;
}

function getArtistName(item) {
  return item.artists.map(({ name }) => name).join(", ");
}

async function getCurrentTrack() {
  const { timestamp, progress_ms, is_playing, item } =
    await callEndpoint("/me/player/currently-playing");

  if (!item?.id) {
    return null;
  }

  const albumName = item?.album?.name;
  const albumArtURL = await getAlbumArtURL(item?.album?.id);
  const artistName = getArtistName(item);
  const trackName = item?.name;
  const trackUrl = item?.external_urls?.spotify;

  return {
    id: item?.id,
    isNowPlaying: is_playing,
    progressMs: progress_ms,
    timestamp,
    albumName,
    albumArtURL,
    artistName,
    trackName,
    trackUrl,
  };
}

async function getTrackAudioFeature(id) {
  const data = await callEndpoint(`/audio-features/${id}`);

  // tidy up the data a bit
  data.durationMs = data.duration_ms;
  data.timeSignature = data.time_signature;
  delete data.duration_ms;
  delete data.time_signature;
  delete data.analysis_url;
  delete data.track_href;
  delete data.uri;
  delete data.id;
  delete data.type;

  return data;
}

function startTimer() {
  return process.hrtime();
}

function elapsedTime(timer) {
  // divide by a million to get nanoseconds to milliseconds
  return process.hrtime(timer)[1] / 1000000;
}

async function getSpotifyRecentTrack() {
  const timer = startTimer();

  const track = await getCurrentTrack();

  if (!track) {
    return null;
  }

  const trackAudioFeatures = await getTrackAudioFeature(track.id);

  const progressThoughTrack =
    track?.progressMs / trackAudioFeatures?.durationMs;

  const beatsPerMillisecond = 60000 / trackAudioFeatures.tempo;

  const timeTakenGettingData = elapsedTime(timer);
  const beatsDelay =
    beatsPerMillisecond -
    (timeTakenGettingData % beatsPerMillisecond);

  return {
    ...track,
    trackAudioFeatures,
    progressThoughTrack,
    beatsPerMillisecond,
    beatsDelay,
  };
}

module.exports = getSpotifyRecentTrack;
