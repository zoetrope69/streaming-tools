import obs from "../obs/index.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("🔥 Command: Charmander");

let isPlaying = false;

async function charmanderCommand({ messageData }) {
  if (isPlaying) {
    return;
  }

  const { user } = messageData;
  logger.log(`${user.username} triggered Charmander`);

  const timeout = 3000;
  obs.turnOnOverlay("Charmander", timeout);

  isPlaying = true;
  setTimeout(() => {
    isPlaying = false;
  }, timeout);
}

export default charmanderCommand;
