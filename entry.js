// get process.env from .env
require("dotenv").config();

const ngrok = require("ngrok");
const nodemon = require("nodemon");

const Logger = require("./src/helpers/logger");
const ngrokLogger = new Logger("👽 ngrok");
const nodemonLogger = new Logger("😈 Nodemon");

const { NODE_ENV, NGROK_AUTH_TOKEN, NGROK_SUBDOMAIN, PORT } =
  process.env;

async function createNgrokUrl() {
  let ngrokUrl;

  if (!(NGROK_AUTH_TOKEN && NGROK_SUBDOMAIN && PORT)) {
    ngrokLogger.error("No environment variables");
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
    ngrokLogger.error(error.message);
  }

  if (!ngrokUrl) {
    ngrokLogger.error("No Ngrok URL");
    return null;
  }

  ngrokLogger.info(`URL: ${ngrokUrl}`);

  return ngrokUrl;
}

async function main() {
  const ngrokUrl = await createNgrokUrl();

  const nodemonProcess = nodemon({
    script: "./src/main",
    exec: `NGROK_URL=${ngrokUrl} GOOGLE_APPLICATION_CREDENTIALS=google-credentials.json node --unhandled-rejections=strict --trace-warnings`,
    // disable watch mode in production
    watch: NODE_ENV === "production" ? [".env"] : [".env", "src/"],
  });

  if (NODE_ENV === "production") {
    nodemonLogger.debug("In production mode, no refreshing");
  }

  nodemonProcess.on("start", () => {
    nodemonLogger.debug("The application has started");
  });

  nodemonProcess.on("restart", (files) => {
    nodemonLogger.debug("Application restarted due to:");
    /* eslint-disable no-console */
    console.group();
    files.forEach((file) => console.log(file));
    console.groupEnd();
    /* eslint-enable no-console */
  });

  nodemonProcess.on("quit", async () => {
    nodemonLogger.debug(
      "The application has quit, closing ngrok tunnel"
    );
    await ngrok.kill();
    process.exit(0);
  });
}

main();
