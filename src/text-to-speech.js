const fetch = require("node-fetch");

// keys must be lowercase
const CUSTOM_WORD_MAP = {
  blgsteve: "B L G Steve",
  bexchat: "Bex Chat",
  specialcei: "Special K",
  cei: "K",
};

function replaceWordsIfNeeded(text) {
  return text
    .split(" ")
    .map((token) => {
      if (
        Object.prototype.hasOwnProperty.call(
          CUSTOM_WORD_MAP,
          token.toLowerCase()
        )
      ) {
        return CUSTOM_WORD_MAP[token.toLowerCase()];
      }

      return token;
    })
    .join(" ");
}

const VOICES = [
  "Brian",
  "Ivy",
  "Justin",
  "Russell",
  "Nicole",
  "Emma",
  "Amy",
  "Joanna",
  "Salli",
  "Kimberly",
  "Kendra",
  "Joey",
];

async function getAudioURL({ voice, text }) {
  const response = await fetch("https://streamlabs.com/polly/speak", {
    method: "POST",
    body: JSON.stringify({
      voice,
      text,
    }),
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });

  if (response.status !== 200) {
    throw new Error(`Something went wrong (${response.statusText})`);
  }

  const json = await response.json();

  if (json.error) {
    throw new Error(json.error);
  }

  if (!json.success) {
    throw new Error(
      "Something went wrong getting text-to-speech audio URL"
    );
  }

  return json.speak_url;
}

async function getAudioURLs(text) {
  const randomVoice =
    VOICES[Math.floor(Math.random() * VOICES.length)];

  return getAudioURL({
    voice: randomVoice,
    text: replaceWordsIfNeeded(text),
  });
}

module.exports = getAudioURLs;
