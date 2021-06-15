const cache = require("memory-cache");

const { getSpreadsheetRows } = require("./helpers/google-sheets");
const logger = require("./helpers/logger");

const CACHE_KEY = "COMMANDS";
const CACHE_TIMEOUT_MS = 10 * 1000; // 10 seconds

async function getCommands() {
  logger.info("🐑 Google Sheet", "Getting commands...");
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

async function getCachedCommands() {
  const cachedCommands = cache.get(CACHE_KEY);

  if (cachedCommands) {
    return cachedCommands;
  }

  const commands = await getCommands();

  cache.put(CACHE_KEY, commands, CACHE_TIMEOUT_MS);

  return commands;
}

async function getScheduledCommands() {
  try {
    const commands = await getCachedCommands();
    const scheduledCommands = commands.filter(
      (command) => command.schedule
    );

    logger.info(
      "🐑 Google Sheet",
      `${scheduledCommands.length} commands`
    );
    return scheduledCommands;
  } catch (e) {
    logger.error("🐑 Google Sheet", e.message || e);
  }
}

module.exports = {
  getCommands: getCachedCommands,
  getScheduledCommands,
};
