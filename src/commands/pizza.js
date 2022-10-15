// import { setTimeout } from "timers/promises"; // eslint-disable-line node/no-missing-import

import obs from "../obs/index.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("🍕 Command: Pizza");

async function pizzaCommand(
  redemptions,
  streamingService,
  messageData
) {
  const { user } = messageData;
  logger.log(`${user.username} triggered pizza`);

  const timeout = 2000;
  obs.turnOnOverlay("Pizza", timeout);
}

export default pizzaCommand;
