import fetch from "node-fetch";

import Logger from "../helpers/logger.js";
const logger = new Logger("🍓 Raspberry PI");

const FLIPPED = false;

async function getBase64StringFromURL(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type");
  const data = Buffer.from(arrayBuffer).toString("base64");
  return `data:${contentType};base64,${data}`;
}

class RaspberryPi {
  constructor({ app }) {
    this.raspberryPiHost = null;

    this.listenForPings({ app });
  }

  listenForPings({ app }) {
    logger.info("Listening for pings...");
    app.post("/ping", (request, response) => {
      logger.debug("Ping endpoint called...");
      const { source, host } = request.body;

      if (source === "raspberry-pi" && host) {
        logger.debug(`Raspberry PI at: ${host}`);
        this.raspberryPiHost = host;
      }

      response.json({ success: true });
    });
  }

  async print(endpoint, options) {
    if (!this.raspberryPiHost) {
      logger.error("No Raspberry PI connected");
      return;
    }

    const url = `${this.raspberryPiHost}/print/${endpoint}`;
    logger.debug(`Calling: ${url}`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });
    const json = await response.json();

    if (!json.success) {
      throw new Error("Something went wrong");
    }

    return;
  }

  async printImage(base64ImageString) {
    return this.print("image", {
      base64ImageString,
      isFlipped: FLIPPED,
    });
  }

  async printEmote({ emoteImage }) {
    const base64Text = await getBase64StringFromURL(emoteImage);
    return this.printImage(base64Text);
  }

  async printText(text) {
    return this.print("text", {
      text,
      isFlipped: FLIPPED,
      isBig: true,
    });
  }
}

export default RaspberryPi;
