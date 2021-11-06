const fetch = require("node-fetch");
const { stringify: queryStringStringify } = require("qs");

const { getAccessToken } = require("../helpers/oauth");

const BASE_URL = "https://api.spotify.com/v1";

async function callEndpoint(
  endpoint,
  queryParams = {},
  options = {}
) {
  const { accessToken } = await getAccessToken({ type: "spotify" });

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

async function playTrack() {
  return await callEndpoint("/me/player/play", {}, { method: "PUT" });
}

async function pauseTrack() {
  return await callEndpoint(
    "/me/player/pause",
    {},
    { method: "PUT" }
  );
}

async function skipTrack() {
  return await callEndpoint(
    "/me/player/next",
    {},
    { method: "POST" }
  );
}

async function getRecentTrack() {
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

module.exports = {
  playTrack,
  pauseTrack,
  skipTrack,
  getRecentTrack,
};
