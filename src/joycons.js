import { EventEmitter } from "events";

import Logger from "./helpers/logger.js";
const logger = new Logger("🎮 Joycons");

const { WINDOWS_SECRET } = process.env;

class Joycons extends EventEmitter {
  constructor({ app }) {
    super();

    app.post("/windows/joycons", (request, response) => {
      const { data, secret } = request.body;

      if (WINDOWS_SECRET !== secret) {
        response.status(500).json({ error: "Something went wrong" });
        return;
      }

      logger.debug(data);

      response.json({ success: true });

      if (data.state === "down") {
        this.emit(data.left ? "leftPress" : "rightPress", data.event);
      }
    });
  }
}

export default Joycons;
