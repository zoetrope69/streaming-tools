const { promises: fs } = require("fs");
const fetch = require("node-fetch");
const { stringify: stringifyQueryString } = require("qs");
const logger = require("./helpers/logger");

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

  return {
    isNowPlaying,
    artistName,
    trackName,
    albumName,
    albumArtURL,
  };
}

function createTrackInfoString({
  isNowPlaying,
  trackName,
  artistName,
}) {
  const nowPlayingString = isNowPlaying
    ? "Now playing"
    : "Last played";
  return `${nowPlayingString}: ${trackName} – ${artistName}`;
}

async function saveTrackInfoStringToFile(trackInfoString) {
  const filePath = `${__dirname}/../public/music-now-playing.txt`;
  const writeFilePromise = await fs.writeFile(
    filePath,
    trackInfoString
  );
  logger.log("🎸 Last.FM", `"${trackInfoString}" saved to file`);
  return writeFilePromise;
}

async function getAlbumArtImageBuffer(albumArtURL) {
  if (!albumArtURL) {
    // if theres no image return default blank image
    const filePath = `${__dirname}/../assets/music-album-art-default.jpg`;
    return fs.readFile(filePath);
  }

  const response = await fetch(albumArtURL);
  return response.buffer();
}

async function saveAlbumArtToFIle(albumArtURL) {
  const imageBuffer = await getAlbumArtImageBuffer(albumArtURL);
  const filePath = `${__dirname}/../public/music-album-art.jpg`;
  const writeFilePromise = await fs.writeFile(filePath, imageBuffer);
  logger.log("🎸 Last.FM", `Album art saved to file`);
  return writeFilePromise;
}

function showRecentTrackOnStreamInterval() {
  getLastFmRecentTrack()
    .then(({ isNowPlaying, trackName, artistName, albumArtURL }) => {
      saveAlbumArtToFIle(albumArtURL).then(() => {
        const trackInfoString = createTrackInfoString({
          isNowPlaying,
          trackName,
          artistName,
        });
        saveTrackInfoStringToFile(trackInfoString);
      });
    })
    .catch((err) => logger.error("🎸 Last.FM", err));
}

function showRecentTrackOnStream() {
  logger.info("🎸 Last.FM", "Syncing to local files...");
  // run as soon as we launch script
  // run every 10 seconds after that
  showRecentTrackOnStreamInterval();
  setInterval(showRecentTrackOnStreamInterval, 1000 * 10);
}

module.exports = showRecentTrackOnStream;
