import wordArtCommand from "./word-art.js";
import showYourPrideCommand from "./show-your-pride.js";

const COMMANDS = {
  word: wordArtCommand,
  pride: showYourPrideCommand,
};

class NewCommands {
  constructor({ redemptions, streamingService }) {
    this.redemptions = redemptions;
    this.streamingService = streamingService;
  }

  async handleMessage(messageData) {
    const { command } = messageData;

    const validCommand = COMMANDS[command];

    if (!validCommand) {
      return null;
    }

    return validCommand(
      this.redemptions,
      this.streamingService,
      messageData
    );
  }
}

export default NewCommands;
