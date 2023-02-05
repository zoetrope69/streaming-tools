import obs from "../obs/index.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("🥫 Command: Coke");

let isPlaying = false;

async function cokeCommand({ messageData }) {
  if (isPlaying) {
    return;
  }

  const { user } = messageData;
  logger.log(`${user.username} triggered coke`);

  const timeout = 2000;
  obs.turnOnOverlay("Coke", timeout);

  isPlaying = true;
  setTimeout(() => {
    isPlaying = false;
  }, timeout);
}

export default cokeCommand;
