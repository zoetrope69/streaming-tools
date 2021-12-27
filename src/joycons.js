import { EventEmitter } from "events";

class Joycons extends EventEmitter {
  constructor({ app }) {
    super();

    app.post("/windows/joycons", (request, response) => {
      const { data } = request.body;

      response.json({ success: true });

      if (data.state === "down") {
        this.emit(data.left ? "leftPress" : "rightPress", data.event);
      }
    });
  }
}

export default Joycons;
