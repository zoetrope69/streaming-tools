const fetch = require("node-fetch");
const hash = require("object-hash");
const { stringify: stringifyQueryString } = require("qs");

const { LAST_FM_API_KEY, LAST_FM_USERNAME } = process.env;

const BASE_URL = `http://ws.audioscrobbler.com/2.0/`;

async function getLastFmRecentTrack() {
  const queryString = stringifyQueryString({
    api_key: LAST_FM_API_KEY,
    format: "json",
    method: "user.getRecentTracks",
    user: LAST_FM_USERNAME,
    limit: 1,
  });

  const url = `${BASE_URL}?${queryString}`;

  const response = await fetch(url);
  const json = await response.json();

  if (
    !json ||
    !json.recenttracks ||
    !json.recenttracks.track ||
    json.recenttracks.track.length === 0
  ) {
    throw new Error("No track info");
  }

  const [track] = json.recenttracks.track;

  const isNowPlaying =
    track["@attr"] && track["@attr"].nowplaying === "true";

  const albumName = track.album["#text"];
  const albumArt = track.image.find((i) => i.size === "large");
  const albumArtURL = albumArt ? albumArt["#text"] : null;
  const artistName = track.artist["#text"];
  const trackName = track.name;
  const trackUrl = track.url;

  const data = {
    isNowPlaying,
    artistName,
    albumName,
    albumArtURL,
    trackName,
    trackUrl,
  };

  return {
    id: hash(data),
    ...data,
  };
}

module.exports = getLastFmRecentTrack;
