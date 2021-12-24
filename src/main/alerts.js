import { v4 as randomID } from "uuid";

let ALERT_QUEUE = [];
let ALERT_IS_RUNNING = false;

// TODO move these to their corresponding redemptions/commands
const ALERT_TYPES = {
  "shout-out": {
    duration: 10000,
    delayAudio: 3100,
  },
  bits: {
    duration: 5000,
  },
  subscribe: {
    duration: 5000,
  },
  say: {
    duration: 5000,
  },
  bigdata: {
    audioUrl: "/assets/alerts/bigdata.mp3",
    duration: 6000,
  },
  immabee: {
    audioUrl: "/assets/alerts/immabee.mp3",
    duration: 4000,
  },
  philpunch: {
    audioUrl: "/assets/alerts/phil-punch.mp3",
    duration: 5000,
    delayAudio: 1000,
  },
  bexchat: {
    audioUrl: "/assets/alerts/bexchat.mp3",
    duration: 10000,
  },
  runescape: {
    duration: 10000,
  },
};

function addToAlertQueue(alert) {
  const newAlertQueue = ALERT_QUEUE.concat([alert]);
  ALERT_QUEUE = newAlertQueue;
}

function removeAlertFromQueue(alertId) {
  const newAlertQueue = ALERT_QUEUE.filter(
    (alert) => alert.id !== alertId
  );
  ALERT_QUEUE = newAlertQueue;
}

function processAlert(io) {
  if (ALERT_QUEUE.length === 0) {
    io.emit("data", { alert: {} }); // clear current alert
    return;
  }

  // if alert is running we wait for it to finish
  if (ALERT_IS_RUNNING) {
    return;
  }

  ALERT_IS_RUNNING = true;
  const [alert] = ALERT_QUEUE;
  io.emit("data", { alert: {} }); // clear current alert
  io.emit("data", { alert });

  if (alert.duration) {
    setTimeout(() => {
      removeAlertFromQueue(alert.id);
      ALERT_IS_RUNNING = false;

      // get next alert if there
      processAlert(io);
    }, alert.duration);
  }
}

class Alerts {
  constructor({ io }) {
    this.io = io;
  }

  send(options) {
    const alertType = ALERT_TYPES[options.type];
    const alert = {
      id: randomID(),
      ...alertType,
      ...options,
    };
    addToAlertQueue(alert);
    processAlert(this.io);
  }

  get alertTypes() {
    return ALERT_TYPES;
  }
}

export default Alerts;
