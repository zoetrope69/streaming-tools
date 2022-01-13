import { EventEmitter } from "events";

import Logger from "./helpers/logger.js";
const logger = new Logger("🚀 Launchpad");

const { WINDOWS_SECRET } = process.env;

class Launchpad extends EventEmitter {
  constructor({ app }) {
    super();

    app.post("/windows/launchpad", (request, response) => {
      const { data, secret } = request.body;

      if (WINDOWS_SECRET !== secret) {
        response.status(500).json({ error: "Something went wrong" });
        return;
      }

      logger.debug(data);

      response.json({ success: true });

      if (data.value === "down") {
        this.emit("press", data);
      }
    });
  }
}

export default Launchpad;
