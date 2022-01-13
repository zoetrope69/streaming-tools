import obs from "./obs/index.js";

import Logger from "./helpers/logger.js";
const logger = new Logger("🕵️ Talking MGS Scene");

async function handleMGSScene({ music }) {
  let wasSpotifyPlayingMusic = false;
  let wasOnMGSScene = false;

  await obs.handleSceneChange(async (sceneName) => {
    // if we move to talking scene, pause music if playing
    if (sceneName === "Talking (MGS)") {
      wasOnMGSScene = true;
      wasSpotifyPlayingMusic = await music.isSpotifyPlaying();

      if (wasSpotifyPlayingMusic) {
        logger.log("Moved to the talking scene, pausing music");
        await music.spotify.pauseTrack();
      }
      return;
    }

    // if we move off the talking scene play music again
    if (wasOnMGSScene && wasSpotifyPlayingMusic) {
      logger.log("Moved away from talking scene resuming music");
      music.spotify.playTrack();
    }
  });
}

export default handleMGSScene;
