import { v4 as randomID } from "uuid";

let ALERT_QUEUE = [];
let ALERT_IS_RUNNING = false;

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
    const alert = {
      id: randomID(),
      ...options,
    };
    addToAlertQueue(alert);
    processAlert(this.io);
  }
}

export default Alerts;
