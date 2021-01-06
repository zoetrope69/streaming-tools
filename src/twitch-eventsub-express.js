const events = require("events");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const logger = require("./helpers/logger");

let RECENT_EVENTSUB_MESSAGES = [];
const IGNORE_DUPLICATE_EVENTSUB_MESSAGES = true;
const IGNORE_OLD_MESSAGES = true;
const { TWITCH_EVENTSUB_SECRET } = process.env;

function verifyEventSubSCallback(request, _response, buffer) {
  logger.debug("🌯 Twitch EventSub", "Verifying webhook request");
  request.isFromTwitch = false;

  if (
    request.headers &&
    Object.prototype.hasOwnProperty.call(
      request.headers,
      "twitch-eventsub-message-signature"
    )
  ) {
    logger.debug(
      "🌯 Twitch EventSub",
      "Request contains message signature, calculating verification signature"
    );
    request.isFromTwitch = true;

    const id = request.headers["twitch-eventsub-message-id"];
    const timestamp =
      request.headers["twitch-eventsub-message-timestamp"];
    const signature = request.headers[
      "twitch-eventsub-message-signature"
    ].split("=");

    request.calculatedSignature = crypto
      .createHmac(signature[0], TWITCH_EVENTSUB_SECRET)
      .update(id + timestamp + buffer)
      .digest("hex");
    request.twitchSignature = signature[1];
  }
}

function eventSubExpress(app) {
  const eventEmitter = new events.EventEmitter();

  app.post(
    "/eventSubCallback",
    bodyParser.json({
      verify: verifyEventSubSCallback,
    }),
    (request, response) => {
      if (!request.isFromTwitch) {
        logger.error(
          "🌯 Twitch EventSub",
          "Received unauthorized request to webhooks endpoint"
        );
        response
          .status(401)
          .send("Unauthorized request to EventSub webhook");
        return;
      }

      if (request.twitchSignature !== request.calculatedSignature) {
        logger.error(
          "🌯 Twitch EventSub",
          `Request message signature ${request.twitchSignature} does not match calculated signature ${request.calculatedSignature}`
        );
        response.status(403).send("Request signature mismatch");
        return;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          request.body,
          "challenge"
        ) &&
        request.headers["twitch-eventsub-message-type"] ===
          "webhook_callback_verification"
      ) {
        logger.debug(
          "🌯 Twitch EventSub",
          `Received challenge for ${request.body.subscription.type}, ${request.body.subscription.id}. Returning challenge.`
        );
        response
          .status(200)
          .type("text/plain")
          .send(encodeURIComponent(request.body.challenge)); // ensure plain string response
        return;
      }

      // if normal event, send OK and handle event
      response.status(200).send("OK");

      // handle dupes and old messages (per config)
      let canFire = true;

      const messageId = request.headers["twitch-eventsub-message-id"];

      if (
        IGNORE_DUPLICATE_EVENTSUB_MESSAGES &&
        RECENT_EVENTSUB_MESSAGES[messageId]
      ) {
        logger.debug(
          "🌯 Twitch EventSub",
          `Received duplicate notification with message id ${messageId}`
        );
        canFire = false;
      }

      const messageAge =
        Date.now() -
        new Date(
          request.headers["twitch-eventsub-message-timestamp"]
        );

      if (IGNORE_OLD_MESSAGES && messageAge > 600000) {
        logger.debug(
          "🌯 Twitch EventSub",
          `Received old notification with message id ${messageId}`
        );
        canFire = false;
      }

      if (!canFire) {
        return;
      }

      // handle different message types
      switch (request.headers["twitch-eventsub-message-type"]) {
        case "notification":
          logger.log(
            "🌯 EventSub",
            `Received notification for type ${request.body.subscription.type}`
          );
          RECENT_EVENTSUB_MESSAGES[messageId] = true;

          setTimeout(() => {
            delete RECENT_EVENTSUB_MESSAGES[messageId];
          }, 601000);

          eventEmitter.emit(
            request.body.subscription.type,
            request.body.event
          );

          break;
        case "revocation":
          logger.log(
            `Received revocation notification for subscription id ${request.body.subscription.id}`
          );
          RECENT_EVENTSUB_MESSAGES[messageId] = true;
          setTimeout(() => {
            delete RECENT_EVENTSUB_MESSAGES[messageId];
          }, 601000);

          eventEmitter.emit("revocation", request.body.subscription);

          break;
        default:
          logger.log(
            `Received request with unhandled message type ${request.headers["twitch-eventsub-message-type"]}`
          );
          break;
      }
    }
  );

  return eventEmitter;
}

module.exports = eventSubExpress;
