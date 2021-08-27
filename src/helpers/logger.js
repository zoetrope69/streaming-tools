const chalk = require("chalk");

const { NODE_ENV } = process.env;
const DEBUG = NODE_ENV !== "production";

const LOG_TYPES_TO_COLOR = {
  log: "yellow",
  info: "white",
  error: "red",
  warn: "orange",
  debug: "blue",
};

class Logger {
  constructor(location) {
    this.location = location;
  }

  log(message) {
    return this.logToConsole("log")(message);
  }

  info(message) {
    return this.logToConsole("info")(message);
  }

  error(message) {
    return this.logToConsole("error")(message);
  }

  warn(message) {
    return this.logToConsole("warn")(message);
  }

  debug(message) {
    return this.logToConsole("debug")(message);
  }

  logToConsole(type) {
    // dont log when not in debug mode
    if (type === "debug" && !DEBUG) {
      return () => {};
    }

    const chalkWithType = chalk[LOG_TYPES_TO_COLOR[type]];
    return (message) => {
      if (!message) return;

      if (Array.isArray(message)) {
        message = message.join(", ");
      } else if (typeof message === "object") {
        message = JSON.stringify(message);
      }

      let response = message;
      if (this.location) {
        response = `[${this.location}] ${message}`;
      }

      // eslint-disable-next-line no-console
      console[type](chalkWithType(response));
    };
  }
}

module.exports = Logger;
