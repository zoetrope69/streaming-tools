import Logger from "../helpers/logger.js";
const logger = new Logger("🔠 Command: Word Art");

let commandReady = true;

function hasCommandCooledDown({ redemptions }) {
  const { is_global_cooldown_enabled, global_cooldown_seconds } =
    redemptions.wordArt.data;

  // if command has no cooldown always return true
  if (!is_global_cooldown_enabled) {
    return true;
  }

  // if we've triggered it and it's not ready do nothing
  if (!commandReady) {
    return false;
  }

  // command is not ready until the cooldown, then make it ready again
  commandReady = false;
  setTimeout(() => {
    commandReady = true;
  }, global_cooldown_seconds * 1000);

  return true;
}

function WordArtCommand({
  redemptions,
  streamingService,
  messageData,
}) {
  const { commandArgumentsWithNoEmotes, user } = messageData;

  logger.log(
    `${user.username} triggered word art with ${commandArgumentsWithNoEmotes}`
  );

  const commandCooledDown = hasCommandCooledDown({ redemptions });

  if (!commandCooledDown) {
    streamingService.chat.sendMessage(
      `@${user.username} you need to wait until the word art command has cooled down`
    );
    return;
  }

  return redemptions.wordArt.start({
    wordArtText: commandArgumentsWithNoEmotes,
    user,
  });
}

export default WordArtCommand;
