// import { setTimeout } from "timers/promises"; // eslint-disable-line node/no-missing-import

import obs from "../obs/index.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("🥫 Command: Coke");

async function cokeCommand(
  redemptions,
  streamingService,
  messageData
) {
  const { user } = messageData;
  logger.log(`${user.username} triggered coke`);

  const timeout = 2000;
  obs.turnOnOverlay("Coke", timeout);
}

export default cokeCommand;
