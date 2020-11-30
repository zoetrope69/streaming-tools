const {
  initialiseHueBulbs,
  setLightsColor,
  resetLights,
} = require("./helpers/hue-bulbs");

const PRIDE_FLAGS = [
  {
    name: "rainbow",
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
    twitchEmote: "NonBinaryPride",
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
];

const PRIDE_FLAGS_ALIAS_MAP = {
  trans: "transgender",
  nonbinary: "non-binary",
  ace: "asexual",
  bi: "bisexual",
};

function getPrideFlag(name) {
  if (!name || name.length === 0) {
    return;
  }

  if (PRIDE_FLAGS_ALIAS_MAP[name]) {
    return getPrideFlag(PRIDE_FLAGS_ALIAS_MAP[name]);
  }

  const flag = PRIDE_FLAGS.find(
    (flag) => flag.name === name || flag.twitchEmote === name
  );

  if (!flag) {
    return;
  }

  return flag;
}

function getRandomPrideFlag() {
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

async function setLightsToPrideFlag(name) {
  await initialiseHueBulbs();

  const prideFlag = getPrideFlag(name);

  if (!prideFlag) {
    return;
  }

  return goThroughColors(prideFlag.lightColors);
}

// initialise on require
initialiseHueBulbs().then(resetLights);

module.exports = {
  getPrideFlag,
  getRandomPrideFlag,
  setLightsToPrideFlag,
};
