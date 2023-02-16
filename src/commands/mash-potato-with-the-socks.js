import obs from "../obs/index.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("🥔🧦 Command: Mash Potato with the Socks");

let isPlaying = false;

async function pepsiCommand({ messageData }) {
  if (isPlaying) {
    return;
  }

  const { user } = messageData;
  logger.log(`${user.username} triggered Mash Potato with the Socks`);

  const timeout = 2000;
  obs.turnOnOverlay("Mash Potato with the Socks", timeout);

  isPlaying = true;
  setTimeout(() => {
    isPlaying = false;
  }, timeout);
}

export default pepsiCommand;
