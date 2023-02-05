import obs from "../obs/index.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("🍶 Command: Pepsi");

let isPlaying = false;

async function pepsiCommand({ messageData }) {
  if (isPlaying) {
    return;
  }

  const { user } = messageData;
  logger.log(`${user.username} triggered pepsi`);

  const timeout = 2000;
  obs.turnOnOverlay("Pepsi", timeout);

  isPlaying = true;
  setTimeout(() => {
    isPlaying = false;
  }, timeout);
}

export default pepsiCommand;
