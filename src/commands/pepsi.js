// import { setTimeout } from "timers/promises"; // eslint-disable-line node/no-missing-import

import obs from "../obs/index.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("🍶 Command: Pepsi");

async function pepsiCommand(
  redemptions,
  streamingService,
  messageData
) {
  const { user } = messageData;
  logger.log(`${user.username} triggered pepsi`);

  const timeout = 2000;
  obs.turnOnOverlay("Pepsi", timeout);
}

export default pepsiCommand;
