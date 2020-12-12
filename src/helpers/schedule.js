const humanToCron = require("human-to-cron");
const cron = require("node-cron");

const { TIMEZONE } = process.env;

function schedule(humanReadibleSchedule, callback) {
  return cron.schedule(humanToCron(humanReadibleSchedule), callback, {
    timezone: TIMEZONE,
  });
}

module.exports = {
  schedule,
};
