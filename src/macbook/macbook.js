import { EventEmitter } from "events";

import fetch from "node-fetch";

const { MACBOOK_SECRET } = process.env;

import Logger from "../helpers/logger.js";
const logger = new Logger("🍎 Macbook");

class Macbook extends EventEmitter {
  constructor({ app }) {
    super();

    this.isAvailable = false;
    this.host = null;
    this.hostTimeout = null;

    this.listenForPings({ app });
  }

  async send(endpoint, data) {
    if (!this.host || !this.isAvailable) {
      logger.error("No Macbook connected");
      return;
    }

    const url = `${this.host}/${endpoint}`;
    const method = data ? "POST" : "GET";
    logger.debug(`Calling: ${url} (${method})`);
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Secret": MACBOOK_SECRET,
      },
      body: data ? JSON.stringify({ data }) : null,
    });
    const json = await response.json();

    if (json.error) {
      throw new Error(json.error);
    }

    return json.data;
  }

  handlePingEndpoint({ response, data }) {
    if (!data.host) {
      response
        .status(500)
        .json({ error: "Missing host sent in data" });
      return;
    }

    logger.debug(`Running at: ${data.host}`);
    this.host = data.host;

    if (this.isAvailable) {
      // set as unavailable if we don't get a ping within 30 secs
      clearTimeout(this.hostTimeout);
      this.hostTimeout = setTimeout(() => {
        this.isAvailable = false;
        this.host = null;
        this.emit("isAvailable", false);
      }, 30000);
    } else {
      this.isAvailable = true;
      this.emit("isAvailable", true);
    }

    response.json({ success: true });
  }

  handleOtherEndpoints({ endpoint, response, data }) {
    this.emit(endpoint, data);
    response.json({ success: true });
  }

  listenForPings({ app }) {
    app.post("/macbook/:endpoint", (request, response) => {
      const { endpoint } = request.params;
      const { data, secret } = request.body;

      if (!endpoint) {
        return response
          .status(500)
          .json({ error: "No endpoint specified" });
      }

      if (MACBOOK_SECRET !== secret) {
        return response
          .status(500)
          .json({ error: "Something went wrong" });
      }

      logger.debug(data);

      if (endpoint === "ping") {
        return this.handlePingEndpoint({
          request,
          response,
          data,
        });
      }

      return this.handleOtherEndpoints({
        endpoint,
        request,
        response,
        data,
      });
    });
  }
}

export default Macbook;
