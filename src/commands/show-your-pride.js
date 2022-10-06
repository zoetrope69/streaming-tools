import Logger from "../helpers/logger.js";
const logger = new Logger("🏳️‍🌈 Command: Show Your Pride");

function showYourPrideCommand(
  redemptions,
  streamingService,
  messageData
) {
  const { commandArgumentsWithNoEmotes, user } = messageData;

  logger.log(
    `${user.username} triggered show your pride with ${commandArgumentsWithNoEmotes}`
  );

  return redemptions.showYourPride.start({
    message: commandArgumentsWithNoEmotes,
    user,
  });
}

export default showYourPrideCommand;
