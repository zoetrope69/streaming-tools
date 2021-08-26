const cache = require("memory-cache");
const { GoogleSpreadsheet } = require("google-spreadsheet");

const googleCredentials = require("../google-credentials.json");
const logger = require("./helpers/logger");

const SPREADSHEET_ID = "1p1xXy096Y_0STY_qJGpBlUsgB2o1zfSrJj13GUGhooA";
const CACHE_KEY = "COMMANDS";
const CACHE_TIMEOUT_MS = 10 * 1000; // 10 seconds

function hasCredentials() {
  return (
    googleCredentials["client_email"] &&
    googleCredentials["private_key"]
  );
}

async function getSpreadsheet() {
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

  await doc.useServiceAccountAuth({
    client_email: googleCredentials["client_email"],
    private_key: googleCredentials["private_key"],
  });

  await doc.loadInfo(); // loads document properties and worksheets

  const sheet = doc.sheetsByIndex[0];

  return sheet;
}

async function getCommands() {
  logger.info("🐑 Google Sheet", "Getting commands...");

  const sheet = await getSpreadsheet();
  const rows = await sheet.getRows();

  return rows
    .map(({ name, value, schedule }) => ({
      name,
      value,
      schedule,
    }))
    .filter(({ name, value }) => {
      return name && name.length !== 0 && value && value.length !== 0;
    });
}

async function getCachedCommands() {
  if (!hasCredentials()) {
    logger.error("🐑 Google Sheet", "No environment variables");
    return [];
  }

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
