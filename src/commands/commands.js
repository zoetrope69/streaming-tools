import charmanderCommand from "./charmander.js";
import cokeCommand from "./coke.js";
import irnBruCommand from "./irn-bru.js";
import mashPotatoWithTheSocksCommand from "./mash-potato-with-the-socks.js";
import pepsiCommand from "./pepsi.js";
import pizzaCommand from "./pizza.js";
import pngCommand from "./png.js";
import poopiesCommand from "./poopies.js";
import showYourPrideCommand from "./show-your-pride.js";
import wordArtCommand from "./word-art.js";

const COMMANDS = {
  pride: showYourPrideCommand,
  word: wordArtCommand,
};

const WORDS = {
  "irn bru": irnBruCommand,
  "mash potato": mashPotatoWithTheSocksCommand,
  charmander: charmanderCommand,
  coke: cokeCommand,
  pepsi: pepsiCommand,
  pizza: pizzaCommand,
  png: pngCommand,
  poopies: poopiesCommand,
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
