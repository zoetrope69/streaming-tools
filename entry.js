// get process.env from .env
require("dotenv").config();

const ngrok = require("ngrok");
const nodemon = require("nodemon");

const logger = require("./src/helpers/logger");

const { NODE_ENV, NGROK_AUTH_TOKEN, NGROK_SUBDOMAIN, PORT } =
  process.env;

async function createNgrokUrl() {
  let ngrokUrl;

  if (!(NGROK_AUTH_TOKEN && NGROK_SUBDOMAIN && PORT)) {
    logger.error("👽 Ngrok", "No environment variables");
    return null;
  }

  try {
    ngrokUrl = await ngrok.connect({
      addr: PORT,
      authtoken: NGROK_AUTH_TOKEN,
      region: "eu",
      subdomain: NGROK_SUBDOMAIN,
    });
  } catch (error) {
    logger.error("👽 Ngrok", error.message);
  }

  if (!ngrokUrl) {
    logger.error("👽 Ngrok", "No Ngrok URL");
    return null;
  }

  logger.info("👽 Ngrok", `URL: ${ngrokUrl}`);

  return ngrokUrl;
}

async function main() {
  const ngrokUrl = await createNgrokUrl();

  const nodemonProcess = nodemon({
    script: "./src/main",
    exec: `NGROK_URL=${ngrokUrl} node`,
    // disable watch mode in production
    watch: NODE_ENV === "production" ? [".env"] : [".env", "src/"],
  });

  if (NODE_ENV === "production") {
    logger.info("😈 Nodemon", "In production mode, no refreshing");
  }

  nodemonProcess.on("start", () => {
    logger.info("😈 Nodemon", "The application has started");
  });

  nodemonProcess.on("restart", (files) => {
    logger.info("😈 Nodemon", "Application restarted due to:");
    /* eslint-disable no-console */
    console.group();
    files.forEach((file) => console.log(file));
    console.groupEnd();
    /* eslint-enable no-console */
  });

  nodemonProcess.on("quit", async () => {
    logger.info(
      "😈 Nodemon",
      "The application has quit, closing ngrok tunnel"
    );
    await ngrok.kill();
    process.exit(0);
  });
}

main();
