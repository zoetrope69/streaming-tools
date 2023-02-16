import obs from "../obs/index.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("💩 Command: Poopies");

let isPlaying = false;

async function poopiesCommand({ messageData }) {
  if (isPlaying) {
    return;
  }

  const { user } = messageData;
  logger.log(`${user.username} triggered Poopies`);

  const timeout = 2000;
  obs.turnOnOverlay("Video: Poopies", timeout);

  isPlaying = true;
  setTimeout(() => {
    isPlaying = false;
  }, timeout);
}

export default poopiesCommand;
