import { EventEmitter } from "events";

import fetch from "node-fetch";

import Logger from "./helpers/logger.js";
const logger = new Logger("🖥️ Computer Mouse/Keyboard");

const { WINDOWS_SECRET } = process.env;

class ComputerMouseKeyboard extends EventEmitter {
  constructor({ app }) {
    super();

    this.host = null;

    this.listenForPings({ app });

    this.mouse.handleChanges({ app });
  }

  async send(endpoint, data) {
    try {
      const url = `${this.host}${endpoint}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: WINDOWS_SECRET,
          data,
        }),
      });
      const json = await response.json();
      logger.debug("jsonnnnn", json);

      if (!json.success) {
        throw new Error("Something went wrong");
      }

      logger.debug(json);
    } catch (e) {
      logger.error(e.message);
    }
  }

  listenForPings({ app }) {
    app.post("/windows/computer", (request, response) => {
      const { data, secret } = request.body;

      if (WINDOWS_SECRET !== secret) {
        response.status(500).json({ error: "Something went wrong" });
        return;
      }

      logger.debug(data);

      if (!data.host) {
        response
          .status(500)
          .json({ error: "Missing host sent in data" });
        return;
      }

      logger.debug(`Windows code running at: ${data.host}`);
      this.host = data.host;

      response.json({ success: true });
    });
  }

  get keyboard() {
    // https://robotjs.io/docs/syntax#keys
    return {
      shortcut: (key, modifiers) => {
        if (!this.host) {
          logger.error("Host not available");
        }

        return this.send("/keyboard/shortcut", { key, modifiers });
      },
    };
  }

  get mouse() {
    return {
      handleChanges: ({ app }) => {
        app.post("/windows/computer/mouse", (request, response) => {
          const { data, secret } = request.body;

          if (WINDOWS_SECRET !== secret) {
            response
              .status(500)
              .json({ error: "Something went wrong" });
            return;
          }

          logger.debug(data);

          response.json({ success: true });
        });
      },
    };
  }
}

export default ComputerMouseKeyboard;
