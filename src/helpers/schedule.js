const humanToCron = require("human-to-cron");
const { CronJob } = require("cron");

const { TIMEZONE } = process.env;

function schedule(humanReadibleSchedule, callback) {
  const onTick = () => callback;
  const onComplete = null;
  const startCron = true;

  new CronJob(
    humanToCron(humanReadibleSchedule),
    onTick,
    onComplete,
    startCron,
    TIMEZONE
  );
}

module.exports = {
  schedule,
};
