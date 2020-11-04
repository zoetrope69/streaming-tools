const events = require("events");
const fetch = require("node-fetch");
const hash = require("object-hash");
const { stringify: stringifyQueryString } = require("qs");
const { v4: randomID } = require("uuid");
const logger = require("./helpers/logger");

const { LAST_FM_API_KEY, LAST_FM_USERNAME } = process.env;

const BASE_URL = `http://ws.audioscrobbler.com/2.0/`;

// default current track to nothing
let CURRENT_NOW_PLAYING_TRACK = {};

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
    logger.error("🎸 Last.FM", "No track info");
    return;
  }

  const [track] = json.recenttracks.track;

  const isNowPlaying =
    track["@attr"] && track["@attr"].nowplaying === "true";

  const artistName = track.artist["#text"];
  const trackName = track.name;
  const albumName = track.album["#text"];
  const albumArt = track.image.find((i) => i.size === "large");
  const albumArtURL = albumArt ? albumArt["#text"] : null;

  const data = {
    isNowPlaying,
    artistName,
    trackName,
    albumName,
    albumArtURL,
  };

  return {
    id: hash(data),
    ...data,
  };
}

async function emitNowPlayingTrack(eventEmitter) {
  try {
    const track = await getLastFmRecentTrack();

    // check if we're already have this track in cache
    if (CURRENT_NOW_PLAYING_TRACK.id === track.id) {
      return;
    }

    // store in our in memory cache if its now playing
    if (track.isNowPlaying) {
      CURRENT_NOW_PLAYING_TRACK = track;
    }

    eventEmitter.emit("track", track);
  } catch (exception) {
    logger.error("🎸 Last.FM", exception);
  }
}

function lastFm() {
  const eventEmitter = new events.EventEmitter();

  logger.info("🎸 Last.FM", "Checking for new now playing song...");
  // run as soon as we launch script
  // run every 10 seconds after that
  emitNowPlayingTrack(eventEmitter);
  setInterval(() => {
    emitNowPlayingTrack(eventEmitter);
  }, 1000 * 10);

  // again gross, should be returning a class or something
  eventEmitter.getCurrentTrack = () => CURRENT_NOW_PLAYING_TRACK;

  return eventEmitter;
}

module.exports = lastFm;
