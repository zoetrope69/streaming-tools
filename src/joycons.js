import { EventEmitter } from "events";

import Logger from "./helpers/logger.js";
const logger = new Logger("🎮 Joycons");

class Joycons extends EventEmitter {
  constructor({ app }) {
    super();

    app.post("/windows/joycons", (request, response) => {
      const { data } = request.body;

      logger.debug({ data });

      response.json({ success: true });

      if (data.state === "down") {
        this.emit(data.left ? "leftPress" : "rightPress", data.event);
      }
    });
  }
}

export default Joycons;
