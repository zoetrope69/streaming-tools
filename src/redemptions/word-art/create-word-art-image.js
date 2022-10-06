import fetch from "node-fetch";
import emojiStrip from "emoji-strip";

const FONT_SIZE = 70;
const URL = "https://cooltext.com/PostChange";

const TEXT_STYLES = [
  {
    id: "780833150",
    name: "Skate",
    emoji: ["🛹", "🛼"],
  },
  {
    id: "732443655",
    name: "Gold",
    emoji: ["🥇", "🪙"],
  },
  {
    id: "732429307",
    name: "Silver",
    emoji: ["🥈", "🍴"],
  },
  {
    id: "1408867449",
    name: "Bronze",
    emoji: ["🥉"],
  },
  {
    id: "17",
    name: "Wood",
    emoji: ["🪵", "🪓"],
  },
  {
    id: "1",
    name: "Alien",
    emoji: ["👽", "👾"],
  },
  {
    id: "13",
    name: "Fire",
    emoji: ["❤️‍🔥", "🔥"],
  },
  {
    id: "4",
    name: "Animated Fire",
    emoji: ["🚒", "🧯", "🧑‍🚒", "👨‍🚒", "👩‍🚒"],
  },
  {
    id: "21",
    name: "Simple",
    emoji: ["🔵"],
  },
  {
    id: "4113131447",
    name: "Car",
    emoji: ["🚗", "🚘"],
  },
  {
    id: "2854656927",
    name: "Miami",
    emoji: ["🏖️", "⛱️", "🩴"],
  },
  {
    id: "789574607",
    name: "Groovy",
    emoji: ["💃", "🕺", "👯", "👯‍♂️", "👯‍♀️", "🎶", "🎵"],
  },
  {
    id: "1783669883",
    name: "Cute",
    emoji: ["💗", "💞", "💓", "💝", "💌"],
  },
  {
    id: "829964308",
    name: "Princess",
    emoji: ["🤴", "👸"],
  },
  {
    id: "4112238638",
    name: "Astronaut",
    emoji: ["🌌", "☄️", "🚀", "🛰️", "🧑‍🚀", "👨‍🚀", "👩‍🚀"],
  },
  {
    id: "1779834160",
    name: "Ice",
    emoji: ["🍦", "🍧", "🍨", "🧊", "❄️", "🏒", "⛸️"],
  },
  {
    id: "https://ct.mob0.com/Previews/2172004512.png",
    name: "Sword",
    emoji: ["🤺", "⚔️", "🔪", "🗡️", "⚔️", "🏹", "🛡️"],
  },
  {
    id: "33",
    name: "Cyber Gay",
    emoji: ["🌈", "🏳️‍🌈"],
  },
  {
    id: "615608693",
    name: "Muddy",
    emoji: ["💩"],
  },
  {
    id: "1408818473",
    name: "Halloween",
    emoji: ["🎃", "🦇"],
  },
  {
    id: "10",
    name: "Bridge",
    emoji: ["🌉"],
  },
  {
    id: "38",
    name: "Fuck Terfs",
    emoji: ["🧙", "🧙‍♂️", "🧙‍♀️", "⚡"],
  },
];

async function getImageUrl({ textStyleId, text }) {
  try {
    const headers = {
      "Content-Type":
        "application/x-www-form-urlencoded; charset=UTF-8",
    };
    const body = [
      `LogoID=${textStyleId}`,
      `Text=${encodeURIComponent(text)}`,
      `FontSize=${FONT_SIZE}`,
      /*
        just ignore these abritary things here,
        it just works you know
      */
      `FileFormat=6`,
      `Integer5=0`,
      `Integer7=0`,
      `Integer8=0`,
      `Integer6=0`,
      `Integer9=0`,
      `Integer13=on`,
      `Integer12=on`,
    ].join("&");
    const response = await fetch(URL, {
      method: "POST",
      headers,
      body,
    });

    const json = await response.json();

    return json?.renderLocation || null;
  } catch (e) {
    console.error(e); // eslint-disable-line no-console
    throw new Error("Something went wrong getting Word Art");
  }
}

function randomTextStyle() {
  return TEXT_STYLES[Math.floor(Math.random() * TEXT_STYLES.length)];
}
async function createWordArtImageUrl(inputString) {
  const emojiRegexString = /\p{Emoji}+/g;
  const regex = new RegExp(emojiRegexString, "u");

  const results = regex.exec(inputString);

  let textStyle = null;
  let text = emojiStrip(inputString).trim();

  if (text.trim().length == 0) {
    throw new Error("No text for word art");
  }

  if (results) {
    const [emoji] = results;

    textStyle = TEXT_STYLES.find((textStyle) => {
      return textStyle.emoji.includes(emoji);
    });
  }

  if (!textStyle) {
    textStyle = randomTextStyle();
  }

  if (textStyle.name === "Fuck Terfs") {
    text = "Fuck TERFs";
  }

  const imageUrl = await getImageUrl({
    textStyleId: textStyle.id,
    text,
  });

  return { imageUrl, text };
}

export default createWordArtImageUrl;
