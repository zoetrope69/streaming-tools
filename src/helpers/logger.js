const chalk = require("chalk");

const LOG_TYPES_TO_COLOR = {
  log: "yellow",
  info: "white",
  error: "red",
};

function logToConsole(type) {
  const chalkWithType = chalk[LOG_TYPES_TO_COLOR[type]];
  return function (location, message) {
    console[type](chalkWithType(`[${location}] ${message}`));
  };
}

const logger = {
  log: logToConsole("log"),
  info: logToConsole("info"),
  error: logToConsole("error"),
};

module.exports = logger;
