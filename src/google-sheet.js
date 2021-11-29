import cache from "memory-cache";
import { GoogleSpreadsheet } from "google-spreadsheet";

import Logger from "./helpers/logger.js";
import importJSON from "./helpers/import-json.js";
const logger = new Logger("🐑 Google Sheet");

const googleCredentials = await importJSON(
  new URL("../google-credentials.json", import.meta.url)
);

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
  logger.info("Getting commands...");

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

export async function getCachedCommands() {
  if (!hasCredentials()) {
    logger.error("No environment variables");
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

export async function getScheduledCommands() {
  try {
    const commands = await getCachedCommands();
    const scheduledCommands = commands.filter(
      (command) => command.schedule
    );

    logger.info(`${scheduledCommands.length} commands`);
    return scheduledCommands;
  } catch (e) {
    logger.error(e.message || e);
  }
}
