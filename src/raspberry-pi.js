import { EventEmitter } from "events";

import fetch from "node-fetch";

import Logger from "./helpers/logger.js";
const logger = new Logger("🍓 Raspberry PI");

const FLIPPED = false;

async function getBase64StringFromURL(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type");
  const data = Buffer.from(arrayBuffer).toString("base64");
  return `data:${contentType};base64,${data}`;
}

class RaspberryPi extends EventEmitter {
  constructor({ app }) {
    super();

    this.raspberryPiHost = null;

    this.listenForPings({ app });
  }

  listenForPings({ app }) {
    logger.info("Listening for pings...");
    app.post("/ping", (request, response) => {
      const { source, host } = request.body;

      if (source === "raspberry-pi" && host) {
        logger.debug(`Raspberry PI at: ${host}`);
        this.raspberryPiHost = host;

        this.emit("available", true);
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

  async printImage({ base64ImageString, ...options }) {
    return this.print("image", {
      base64ImageString,
      isFlipped: FLIPPED,
      ...options,
    });
  }

  async printEmote({ emoteImage, ...options }) {
    const base64ImageString = await getBase64StringFromURL(
      emoteImage
    );

    return this.printImage({
      base64ImageString,
      ...options,
      lineFeed: {
        after: 5,
      },
    });
  }

  async printText(text, options = {}) {
    return this.print("text", {
      text,
      isFlipped: FLIPPED,
      ...options,
    });
  }
}

export default RaspberryPi;
