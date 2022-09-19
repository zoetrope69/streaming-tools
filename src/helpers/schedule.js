import cron from "node-cron";

const { TIMEZONE } = process.env;

export function schedule(minutes, callback) {
  return cron.schedule(`*/${minutes} * * * *`, callback, {
    timezone: TIMEZONE,
  });
}
