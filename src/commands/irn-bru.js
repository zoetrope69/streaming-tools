import obs from "../obs/index.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("🥫 Command: Irn Bru");

let isPlaying = false;

async function pngCommand({ messageData }) {
  if (isPlaying) {
    return;
  }

  const { user } = messageData;
  logger.log(`${user.username} triggered Irn Bru`);

  const timeout = 3000;
  obs.turnOnOverlay("Irn Bru", timeout);

  isPlaying = true;
  setTimeout(() => {
    isPlaying = false;
  }, timeout);
}

export default pngCommand;
