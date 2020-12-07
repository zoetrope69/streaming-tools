const cache = require("memory-cache");

const { getSpreadsheetRows } = require("./helpers/google-sheets");

const CACHE_KEY = "COMMANDS";
const CACHE_TIMEOUT_MS = 60 * 60 * 1000; // 1 minute

async function getCommands() {
  const rows = await getSpreadsheetRows({
    spreadsheetId: "1p1xXy096Y_0STY_qJGpBlUsgB2o1zfSrJj13GUGhooA",
    range: "Commands!A2:C",
  });

  const rowObjects = rows.map(([name, value, schedule]) => ({
    name,
    value,
    schedule,
  }));

  // filter out invalid commands
  return rowObjects.filter(({ name, value }) => {
    return name && name.length !== 0 && value && value.length !== 0;
  });
}

async function initialise() {
  const commands = await getCommands();
  cache.put(CACHE_KEY, commands, CACHE_TIMEOUT_MS);
}

async function getCachedCommands() {
  const cachedCommands = cache.get(CACHE_KEY);

  if (cachedCommands) {
    return cachedCommands;
  }

  return getCommands();
}

async function getScheduledCommands() {
  const scheduledCommands = await getCachedCommands.filter(
    (command) => command.schedule
  );

  return scheduledCommands;
}

module.exports = {
  initialise,
  getCommands: getCachedCommands,
  getScheduledCommands,
};
