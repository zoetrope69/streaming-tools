const replaceAll = require("replaceall");

function replaceTextWithEmotes(text, tokens) {
  const emotes = tokens.filter((token) => token.type === "emote");

  if (!emotes || emotes.length === 0) {
    return text;
  }

  let replacedText = ` ${text} `; // add some padding
  emotes.forEach(({ src: image, text: code }) => {
    // adding padding so we don't replace emote code inside of text
    const paddedCode = ` ${code} `;
    const emoteImageElement = ` <img class="emote emote--glimesh" src="${image}" alt="${code}" /> `;

    replacedText = replaceAll(
      paddedCode,
      emoteImageElement,
      replacedText
    );
  });

  return replacedText.trim();
}

module.exports = replaceTextWithEmotes;
