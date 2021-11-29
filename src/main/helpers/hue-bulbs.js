import fetch from "node-fetch";

import { colorNameToXY, hexToXY } from "./color-converting.js";

import Logger from "../../helpers/logger.js";
const logger = new Logger("💡 Hue Bulbs");

const { HUE_BULB_USERNAME, HUE_BULB_HUB_IP_ADDRESS } = process.env;

const BASE_URI = `http://${HUE_BULB_HUB_IP_ADDRESS}/api/${HUE_BULB_USERNAME}/`;

let DEFAULT_LIGHT_STATES = {};

const LIGHTS = {
  "00:17:88:01:04:6e:b3:85-0b": "ceiling",
  "00:17:88:01:04:36:8a:62-0b": "lamp",
  "00:17:88:01:08:d8:72:cc-0b": "fairy-lights",
};

function hasValidEnvironmentVariables() {
  return HUE_BULB_HUB_IP_ADDRESS && HUE_BULB_USERNAME;
}

async function callHueBulbAPI(uri, { method, body } = {}) {
  if (!hasValidEnvironmentVariables()) {
    logger.error("Invalid enivornment variables");
    return null;
  }

  let json = null;
  try {
    const response = await fetch(`${BASE_URI}${uri}`, {
      method,
      body: JSON.stringify(body),
    });
    json = await response.json();
  } catch (e) {
    logger.error(e.message || e);
  }
  return json;
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

export async function setLightsColor(colorInput) {
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

export async function setFairyLights(value) {
  const light = await getLightByName("fairy-lights");

  if (!light) {
    return;
  }

  return callHueBulbAPI(`lights/${light.id}/state`, {
    method: "PUT",
    body: value,
  });
}

export async function resetLights() {
  if (!DEFAULT_LIGHT_STATES) {
    return;
  }

  ["ceiling", "lamp", "fairy-lights"].forEach(async (lightName) => {
    const defaultState = DEFAULT_LIGHT_STATES[lightName];
    if (!defaultState) {
      return;
    }

    const light = await getLightByName(lightName);

    if (light) {
      callHueBulbAPI(`lights/${light.id}/state`, {
        method: "PUT",
        body: defaultState,
      });
    }
  });
}

export async function initDefaultLights() {
  const lights = await getLights();

  if (!lights || lights.length === 0) {
    return;
  }

  lights.forEach((light) => {
    if (!light.name || !light.state) {
      return;
    }

    DEFAULT_LIGHT_STATES[light.name] = light.state;
  });
}

initDefaultLights();
