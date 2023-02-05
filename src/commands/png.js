import obs from "../obs/index.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("👨‍🦲 Command: PNG");

let isPlaying = false;

async function pngCommand({ messageData }) {
  if (isPlaying) {
    return;
  }

  const { user } = messageData;
  logger.log(`${user.username} triggered PNG`);

  const timeout = 3000;
  obs.turnOnOverlay("PNG", timeout);

  isPlaying = true;
  setTimeout(() => {
    isPlaying = false;
  }, timeout);
}

export default pngCommand;
