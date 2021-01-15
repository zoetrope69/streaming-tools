const fetch = require("node-fetch");
const { colorNameToXY, hexToXY } = require("./color-converting");

const { HUE_BULB_USERNAME, HUE_BULB_HUB_IP_ADDRESS } = process.env;

const LIGHTS = {
  "00:17:88:01:04:6e:b3:85-0b": "ceiling",
  "00:17:88:01:04:36:8a:62-0b": "lamp",
  "00:17:88:01:08:d8:72:cc-0b": "fairy-lights",
};

async function callHueBulbAPIBuilder() {
  const BASE_URI = `http://${HUE_BULB_HUB_IP_ADDRESS}/api/${HUE_BULB_USERNAME}/`;
  return async function (uri, { method, body } = {}) {
    const response = await fetch(`${BASE_URI}${uri}`, {
      method,
      body: JSON.stringify(body),
    });
    const json = await response.json();
    return json;
  };
}

let hueBulbsReady = false;
let callHueBulbAPI = () => null;
async function initialiseHueBulbs() {
  if (hueBulbsReady) {
    return Promise.resolve();
  }

  hueBulbsReady = true;
  callHueBulbAPI = await callHueBulbAPIBuilder();
}

function getColorState(colorInput) {
  if (colorInput === "black") {
    // turn light off
    return { on: false };
  }

  if (colorInput === "grey" || colorInput === "gray") {
    // turn light low brightness for grey
    return { xy: colorNameToXY("white"), bri: 50 };
  }

  if (colorInput.startsWith("#")) {
    return { xy: hexToXY(colorInput) };
  }

  return { xy: colorNameToXY(colorInput) };
}

async function getLights() {
  const lights = await callHueBulbAPI("lights");

  if (!lights) {
    return [];
  }

  return Object.keys(lights).map((lightId) => {
    const item = lights[lightId];
    return {
      ...item,
      id: lightId,
      name: LIGHTS[item.uniqueid],
    };
  });
}

async function getLightByName(name) {
  const lights = await getLights();
  return lights.find((light) => light.name === name);
}

async function setLightsColor(colorInput) {
  const colorState = getColorState(colorInput);

  if (!colorState) {
    return;
  }

  ["ceiling", "lamp"].forEach(async (lightName) => {
    const light = await getLightByName(lightName);

    if (light) {
      callHueBulbAPI(`lights/${light.id}/state`, {
        method: "PUT",
        body: { on: true, bri: 254, ...colorState },
      });
    }
  });
}

async function setFairyLights(value) {
  const light = await getLightByName("fairy-lights");

  if (!light) {
    return;
  }

  return callHueBulbAPI(`lights/${light.id}/state`, {
    method: "PUT",
    body: value,
  });
}

async function resetLights() {
  await setLightsColor("warm");
  return;
}

module.exports = {
  initialiseHueBulbs,
  setLightsColor,
  setFairyLights,
  resetLights,
};
