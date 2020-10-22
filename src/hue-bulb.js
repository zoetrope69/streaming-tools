// get process.env from .env
require("dotenv").config();

const fetch = require("node-fetch");
const { hslToXY } = require("./helpers/color-converting");

const { HUE_BULB_USERNAME } = process.env;

async function getHueBulbIPAddress() {
  const ipAddressResponse = await fetch(
    "https://discovery.meethue.com/"
  );
  const ipAddressJSON = await ipAddressResponse.json();

  if (
    ipAddressJSON.length === 0 ||
    typeof ipAddressJSON[0].internalipaddress === "undefined"
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

async function main() {
  const hueBulbIpAddress = await getHueBulbIPAddress();
  const callHueBulbAPI = callHueBulbAPIBuilder(hueBulbIpAddress);

  //   await callHueBulbAPI("lights");
  const light = await callHueBulbAPI("lights/5");

  const color = hslToXY([100, 35, 58]);

  const a = await callHueBulbAPI("lights/5/state", {
    method: "PUT",
    body: { on: true, xy: color },
  });

  return a;
}

main().then(console.log).catch(console.error);
