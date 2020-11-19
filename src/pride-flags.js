const {
  initialiseHueBulbs,
  setLightsColor,
  resetLights,
  setFairyLights,
} = require("./helpers/hue-bulbs");

const PRIDE_FLAGS = {
  rainbow: {
    name: "rainbow",
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
  agender: {
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
  aromantic: {
    name: "aromantic",
    lightColors: ["green", "light green", "white", "grey", "black"],
  },
  asexual: {
    name: "asexual",
    lightColors: ["black", "grey", "white", "purple"],
  },
  bisexual: {
    name: "bisexual",
    lightColors: ["pink", "purple", "blue"],
  },
  genderfluid: {
    name: "genderfluid",
    lightColors: ["pink", "white", "purple", "black", "blue"],
  },
  genderqueer: {
    name: "genderqueer",
    lightColors: ["purple", "white", "green"],
  },
  intersex: {
    name: "intersex",
    lightColors: ["yellow", "purple", "yellow", "purple", "yellow"],
  },
  lesbian: {
    name: "lesbian",
    lightColors: ["red", "orange", "white", "pink", "purple"],
  },
  "non-binary": {
    name: "non-binary",
    lightColors: ["yellow", "white", "purple", "black"],
  },
  pansexual: {
    name: "pansexual",
    lightColors: ["pink", "yellow", "light blue"],
  },
  polysexual: {
    name: "polysexual",
    lightColors: ["pink", "green", "light blue"],
  },
  transgender: {
    name: "transgender",
    lightColors: [
      "light blue",
      "pink",
      "white",
      "pink",
      "light blue",
    ],
  },
};

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

  if (!PRIDE_FLAGS[name]) {
    return;
  }

  return PRIDE_FLAGS[name];
}

function getRandomPrideFlag() {
  const prideFlagNames = Object.keys(PRIDE_FLAGS);
  const randomPrideFlagName =
    prideFlagNames[Math.floor(Math.random() * prideFlagNames.length)];
  return PRIDE_FLAGS[randomPrideFlagName];
}

async function goThroughColors(colors) {
  return new Promise(async (resolve) => {
    // wait for fairy lights to turn off
    setTimeout(() => {
      const COLOR_DURATION = 2000;
      colors.map((color, i) => {
        setTimeout(() => {
          setLightsColor(color);
        }, COLOR_DURATION * i);
      });

      // reset after all the other colours
      setTimeout(async () => {
        await resetLights();
        resolve();
      }, COLOR_DURATION * colors.length);
    }, 500);
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
