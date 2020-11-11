const {
  initialiseHueBulbs,
  setLightsColor,
  resetLights,
  setFairyLights,
} = require("./helpers/hue-bulbs");

const PRIDE_BANNERS = {
  pride: ["red", "orange", "yellow", "green", "blue", "purple"],
  agender: [],
  aromantic: [],
  asexual: [],
  bisexual: [],
  genderfluid: [],
  genderqueer: [],
  intersex: ["yellow", "purple", "yellow", "purple", "yellow"],
  lesbian: [],
  "non-binary": [],
  pansexual: [],
  polysexual: [],
  transgender: ["light blue", "pink", "white", "pink", "light blue"],
};

async function goThroughColors(colors) {
  return new Promise(async (resolve) => {
    await setFairyLights({ on: false });
    // wait for fairy lights to turn off
    setTimeout(() => {
      const COLOR_DURATION = 1000;
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

async function setPrideColor(name) {
  await initialiseHueBulbs();

  const colors = PRIDE_BANNERS[name];

  if (!colors) {
    return;
  }

  return goThroughColors(colors);
}

// initialise on require
initialiseHueBulbs();

module.exports = setPrideColor;
