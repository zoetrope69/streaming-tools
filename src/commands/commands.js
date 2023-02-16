import wordArtCommand from "./word-art.js";
import showYourPrideCommand from "./show-your-pride.js";
import cokeCommand from "./coke.js";
import pepsiCommand from "./pepsi.js";
import pizzaCommand from "./pizza.js";
import pngCommand from "./png.js";
import irnBruCommand from "./irn-bru.js";
import poopiesCommand from "./poopies.js";
import mashPotatoWithTheSocksCommand from "./mash-potato-with-the-socks.js";

const COMMANDS = {
  word: wordArtCommand,
  pride: showYourPrideCommand,
};

const WORDS = {
  coke: cokeCommand,
  pepsi: pepsiCommand,
  pizza: pizzaCommand,
  png: pngCommand,
  poopies: poopiesCommand,
  "irn bru": irnBruCommand,
  "mash potato": mashPotatoWithTheSocksCommand,
};

class NewCommands {
  constructor({ redemptions, streamingService }) {
    this.redemptions = redemptions;
    this.streamingService = streamingService;
  }

  getValidWordsInMessage(message) {
    let validWords = [];

    Object.keys(WORDS).forEach((word) => {
      const hasWordInMessage = message.toLowerCase().includes(word);
      if (hasWordInMessage && !validWords.includes(word)) {
        validWords.push(WORDS[word]);
      }
    });

    return validWords;
  }

  async handleMessage(messageData) {
    const { command, message } = messageData;

    const validCommand = COMMANDS[command];
    const validWords = this.getValidWordsInMessage(message);

    if (validCommand) {
      return validCommand({
        redemptions: this.redemptions,
        streamingService: this.streamingService,
        messageData,
      });
    }

    if (validWords && validWords.length !== 0) {
      validWords.forEach((validWord) => {
        validWord({
          redemptions: this.redemptions,
          streamingService: this.streamingService,
          messageData,
        });
      });
      return;
    }

    return;
  }
}

export default NewCommands;
