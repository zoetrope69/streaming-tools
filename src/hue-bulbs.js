// get process.env from .env
require("dotenv").config();

const fetch = require("node-fetch");
const {
  colorNameToXY,
  hexToXY,
} = require("./helpers/color-converting");

const { HUE_BULB_USERNAME } = process.env;

const LIGHTS = {
  "00:17:88:01:04:6e:b3:85-0b": "ceiling",
  "00:17:88:01:04:36:8a:62-0b": "lamp",
  "00:17:88:01:08:d8:72:cc-0b": "fairyLights",
};

async function getHueBulbIPAddress() {
  const ipAddressResponse = await fetch(
    "https://discovery.meethue.com/"
  );
  const ipAddressJSON = await ipAddressResponse.json();

  if (
    ipAddressJSON.length === 0 ||
    typeof ipAddressJSON[0].internalipaddress ===
      "undefined"
  ) {
    throw new Error("Missing IP address");
  }

  return ipAddressJSON[0].internalipaddress;
}

function callHueBulbAPIBuilder(hueBulbIpAddress) {
  const BASE_URI = `http://${hueBulbIpAddress}/api/${HUE_BULB_USERNAME}/`;
  return async function (uri, { method, body } = {}) {
    const response = await fetch(`${BASE_URI}${uri}`, {
      method,
      body: JSON.stringify(body),
    });
    const json = await response.json();
    return json;
  };
}

function getColor(colorInput) {
  if (colorInput === "reset") {
    return [0.4575, 0.4099];
  }

  if (colorInput.startsWith("#")) {
    return hexToXY(colorInput);
  }

  return colorNameToXY(colorInput);
}

async function setLightsColor(colorInput) {
  const hueBulbIpAddress = await getHueBulbIPAddress();
  const callHueBulbAPI = callHueBulbAPIBuilder(
    hueBulbIpAddress
  );

  async function getLights() {
    const lights = await callHueBulbAPI("lights");

    return Object.keys(lights).map((lightId) => {
      const item = lights[lightId];
      return {
        ...item,
        id: lightId,
        name: LIGHTS[item.uniqueid],
      };
    });
  }

  const lights = await getLights();

  function getLightByName(name) {
    return lights.find((light) => light.name === name);
  }

  const color = getColor(colorInput);

  if (!color) {
    return;
  }

  ["ceiling", "lamp"].forEach((lightName) => {
    const light = getLightByName(lightName);
    callHueBulbAPI(`lights/${light.id}/state`, {
      method: "PUT",
      body: { on: true, xy: color },
    });
  });
}

module.exports = setLightsColor;
