const { EventEmitter } = require("events");
const bodyParser = require("body-parser");

const logger = require("./helpers/logger");

const { KOFI_ENDPOINT_RANDOM_STRING } = process.env;

function koFi({ ngrokUrl, app }) {
  const eventEmitter = new EventEmitter();

  if (!ngrokUrl) {
    return eventEmitter;
  }

  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }));

  const endpoint = `/koFiCallback-${KOFI_ENDPOINT_RANDOM_STRING}`;
  logger.info(
    "☕ Ko-fi Webhook",
    `Created and listening on ${ngrokUrl}${endpoint}`
  );
  app.post(endpoint, (request, response) => {
    try {
      const { data } = request.body;
      const json = JSON.parse(data);

      const {
        message_id: id,
        is_public: isPublic,
        from_name: fromName,
        message,
        amount,
        type,
      } = json;

      // check if it has correct data
      if (!id || !fromName) {
        throw new Error(
          `Incorrect webhook data ${JSON.stringify(json)}`
        );
      }

      logger.info("☕ Ko-fi Webhook", "Payment received");

      eventEmitter.emit("payment", {
        id,
        type,
        isAnonymous: !isPublic,
        user: {
          username: fromName,
          message: isPublic ? message : null,
        },
        amount,
      });
    } catch (e) {
      logger.error("☕ Ko-fi Webhook", e);
    }

    response.sendStatus(200);
  });

  return eventEmitter;
}

module.exports = koFi;
