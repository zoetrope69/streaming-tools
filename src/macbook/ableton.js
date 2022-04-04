import { EventEmitter } from "events";

class Ableton extends EventEmitter {
  constructor({ macbook }) {
    super();

    this.macbook = macbook;

    this.isConnected = false;
    this.isPlaying = false;
    this.tempo = undefined;

    this.handleAbletonData();

    if (this.macbook.isAvailable) {
      this.getIsConnected();
    }
    this.macbook.on("isAvailable", async (isAvailable) => {
      if (isAvailable) {
        await this.getIsConnected();
        await this.syncData();
      } else {
        this.isConnected = false;
        this.isPlaying = false;
        this.tempo = undefined;
      }
    });

    this.on("isConnected", (isConnected) => {
      if (isConnected) {
        this.isConnected = true;
        this.syncData();
      } else {
        this.isConnected = false;
        this.isPlaying = false;
        this.tempo = undefined;
      }
    });
  }

  async syncData() {
    if (this.isConnected) {
      await this.getIsPlaying();
      await this.getTempo();
    }
  }

  handleAbletonData() {
    this.macbook.on("ableton", (data) => {
      Object.entries(data).forEach(([type, value]) => {
        if (typeof value !== undefined) {
          this[type] = value;
          this.emit(type, value);
        }
      });
    });
  }

  async getIsConnected() {
    const isConnected = await this.macbook.send(
      "ableton/isConnected"
    );

    if (typeof isConnected !== undefined) {
      this.isConnected = isConnected;
      this.emit("isConnected", this.isConnected);
    }
  }

  async getIsPlaying() {
    const isPlaying = await this.macbook.send("ableton/isPlaying");

    if (typeof isPlaying !== undefined) {
      this.isPlaying = isPlaying;
      this.emit("isPlaying", this.isPlaying);
    }
  }

  async getTempo() {
    const tempo = await this.macbook.send("ableton/tempo");

    if (typeof tempo !== undefined) {
      this.tempo = tempo;
      this.emit("tempo", this.tempo);
    }
  }

  setTempo(value) {
    const MAX_NUMBER = 999;
    const MIN_NUMBER = 20;

    const tempo = parseFloat(value.trim(), 10);

    if (isNaN(tempo)) {
      throw new Error(`"${value.trim()}" isn't a valid number`);
    }

    if (tempo > MAX_NUMBER) {
      throw new Error(`${tempo} is too big. max is ${MAX_NUMBER}`);
    }

    if (tempo < MIN_NUMBER) {
      throw new Error(`${tempo} is too small. min is ${MIN_NUMBER}`);
    }

    this.macbook.send("ableton/tempo", { tempo });
  }
}

export default Ableton;
