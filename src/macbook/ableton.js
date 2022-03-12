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
        this.syncData();
      } else {
        this.isConnected = false;
        this.isPlaying = false;
        this.tempo = undefined;
      }
    });

    this.on("isConnected", (isConnected) => {
      if (isConnected) {
        this.syncData();
      } else {
        this.isConnected = false;
        this.isPlaying = false;
        this.tempo = undefined;
      }
    });
  }

  async syncData() {
    await this.getIsConnected();
    await this.getIsPlaying();
    await this.getTempo();
  }

  handleAbletonData() {
    this.macbook.on("ableton", (data) => {
      Object.entries(data).forEach(([type, value]) => {
        if (typeof value !== undefined && this[type] !== value) {
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

    if (
      typeof isConnected !== undefined &&
      this.isConnected !== isConnected
    ) {
      this.isConnected = isConnected;
      this.emit("isConnected", this.isConnected);
    }
  }

  async getIsPlaying() {
    const isPlaying = await this.macbook.send("ableton/isPlaying");

    if (
      typeof isPlaying !== undefined &&
      this.isPlaying !== isPlaying
    ) {
      this.isPlaying = isPlaying;
      this.emit("isPlaying", this.isPlaying);
    }
  }

  async getTempo() {
    const tempo = await this.macbook.send("ableton/tempo");

    if (typeof tempo !== undefined && this.tempo !== tempo) {
      this.tempo = tempo;
      this.emit("tempo", this.tempo);
    }
  }

  setTempo(tempo) {
    // TODO: handle non-tempo values
    this.macbook.send("ableton/tempo", tempo);
  }
}

export default Ableton;
