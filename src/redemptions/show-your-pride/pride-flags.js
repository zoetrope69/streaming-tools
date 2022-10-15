import {
  setLightsColor,
  resetLights,
} from "../../helpers/hue-bulbs.js";

const PRIDE_FLAGS = [
  {
    name: "gay",
    twitchEmote: "GayPride",
    lightColors: [
      "black",
      "red",
      "orange",
      "yellow",
      "green",
      "blue",
      "purple",
    ],
  },
  {
    name: "agender",
    lightColors: [
      "black",
      "grey",
      "white",
      "light green",
      "white",
      "grey",
      "black",
    ],
  },
  {
    name: "aromantic",
    lightColors: ["green", "light green", "white", "grey", "black"],
  },
  {
    name: "asexual",
    twitchEmote: "AsexualPride",
    lightColors: ["black", "grey", "white", "purple"],
  },
  {
    name: "bisexual",
    twitchEmote: "BisexualPride",
    lightColors: ["pink", "purple", "blue"],
  },
  {
    name: "genderfluid",
    twitchEmote: "GenderFluidPride",
    lightColors: ["pink", "white", "purple", "black", "blue"],
  },
  {
    name: "genderqueer",
    lightColors: ["purple", "white", "green"],
  },
  {
    name: "grey-asexual",
    lightColors: ["purple", "grey", "white", "grey", "purple"],
  },
  {
    name: "intersex",
    twitchEmote: "IntersexPride",
    lightColors: ["yellow", "purple", "yellow", "purple", "yellow"],
  },
  {
    name: "lesbian",
    twitchEmote: "LesbianPride",
    lightColors: ["red", "orange", "white", "pink", "purple"],
  },
  {
    name: "non-binary",
    twitchEmote: "NonbinaryPride",
    lightColors: ["yellow", "white", "purple", "black"],
  },
  {
    name: "pansexual",
    twitchEmote: "PansexualPride",
    lightColors: ["pink", "yellow", "light blue"],
  },
  {
    name: "polysexual",
    lightColors: ["pink", "green", "light blue"],
  },
  {
    name: "transgender",
    twitchEmote: "TransgenderPride",
    lightColors: [
      "light blue",
      "pink",
      "white",
      "pink",
      "light blue",
    ],
  },
  {
    name: "snailgender",
    twitchEmote: "🐌",
    twitchMessage: "https://lgbta.wikia.org/wiki/Snailgender",
    lightColors: ["green", "white", "brown"],
  },
];

const PRIDE_FLAGS_ALIAS_MAP = {
  trans: "transgender",
  nonbinary: "non-binary",
  ace: "asexual",
  bi: "bisexual",
  rainbow: "gay",
  homosexual: "gay",
  snail: "snailgender",
  "gray-asexual": "grey-asexual",
  grayasexual: "grey-asexual",
  greyasexual: "grey-asexual",
  greysexual: "grey-asexual",
  graysexual: "grey-asexual",
};

export function getPrideFlag(name) {
  if (!name || name.length === 0) {
    return;
  }

  const caseInsensitiveName = name.toLowerCase();

  if (PRIDE_FLAGS_ALIAS_MAP[caseInsensitiveName]) {
    return getPrideFlag(PRIDE_FLAGS_ALIAS_MAP[caseInsensitiveName]);
  }

  const flag = PRIDE_FLAGS.find(
    (flag) =>
      flag.name === caseInsensitiveName ||
      flag.twitchEmote === caseInsensitiveName
  );

  if (!flag) {
    return;
  }

  return flag;
}

export function getRandomPrideFlag() {
  const prideFlagNames = Object.keys(PRIDE_FLAGS);
  const randomPrideFlagName =
    prideFlagNames[Math.floor(Math.random() * prideFlagNames.length)];
  return PRIDE_FLAGS[randomPrideFlagName];
}

async function goThroughColors(colors) {
  return new Promise((resolve) => {
    const COLOR_DURATION = 2000;
    colors.map((color, i) => {
      setTimeout(() => {
        setLightsColor(color);
      }, COLOR_DURATION * i);
    });

    setTimeout(async () => {
      await resetLights();
      resolve();
    }, COLOR_DURATION * colors.length);
  });
}

export async function setLightsToPrideFlag(name) {
  const prideFlag = getPrideFlag(name);

  if (!prideFlag) {
    return;
  }

  return goThroughColors(prideFlag.lightColors);
}
