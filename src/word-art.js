import fetch from "node-fetch";
import emojiStrip from "emoji-strip";

const FONT_SIZE = 200;
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
    id: "4",
    name: "Fire",
    emoji: ["❤️‍🔥", "🔥", "🚒", "🧯", "🧑‍🚒", "👨‍🚒", "👩‍🚒"],
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
];

async function getTextImageUrl({ textStyleId, text }) {
  try {
    const headers = {
      "Content-Type":
        "application/x-www-form-urlencoded; charset=UTF-8",
    };
    const body = [
      `LogoID=${textStyleId}`,
      `Text=${encodeURIComponent(text)}`,
      `FontSize=${FONT_SIZE}`,
    ].join("&");
    const response = await fetch(URL, {
      method: "POST",
      headers,
      body,
    });

    const json = await response.json();

    return json?.renderLocation || null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function textWithEmojiToLogo(inputString) {
  const emojiRegexString = /\p{Emoji}+/g;
  const regex = new RegExp(emojiRegexString, "u");

  const results = regex.exec(inputString);

  if (!results) {
    console.error(new Error("No emoji in input"));
    return null;
  }

  const [emoji] = results;
  const text = emojiStrip(inputString).trim();

  const textStyle = TEXT_STYLES.find((textStyle) => {
    return textStyle.emoji.includes(emoji);
  });

  if (!textStyle) {
    return null;
  }

  const textImageUrl = await getTextImageUrl({
    textStyleId: textStyle.id,
    text,
  });

  return textImageUrl;
}

async function main() {
  const a = await textWithEmojiToLogo("nicey 🎃 nice 🏳️‍🌈");
  console.log(a);
}
main();
