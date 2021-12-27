import { EventEmitter } from "events";

class Launchpad extends EventEmitter {
  constructor({ app }) {
    super();

    app.post("/windows/launchpad", (request, response) => {
      const { data } = request.body;

      response.json({ success: true });

      if (data.value === "down") {
        this.emit("press", data);
      }
    });
  }
}

export default Launchpad;
