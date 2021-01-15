const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const logger = require("./logger");

// If modifying these scopes, delete token.json.
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "google-token.json";
const CREDENTIALS_PATH = "google-credentials.json";

function getGoogleOAuth2Client() {
  return new Promise((resolve, reject) => {
    // Load client secrets from a local file.
    fs.readFile(CREDENTIALS_PATH, (err, content) => {
      if (err) return reject(err);
      // Authorize a client with credentials, then call the Google Sheets API.
      resolve(authorize(JSON.parse(content)));
    });
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials) {
  return new Promise((resolve) => {
    const {
      client_secret,
      client_id,
      redirect_uris,
    } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) {
        return resolve(getNewToken(oAuth2Client));
      }

      oAuth2Client.setCredentials(JSON.parse(token));
      resolve(oAuth2Client);
    });
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
function getNewToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });

    logger.error(
      "🐑 Google Sheets",
      `Authorize this app by visiting this url: ${authUrl}`
    );

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Enter the code from that page here: ", (code) => {
      rl.close();

      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          return reject(err);
        }

        oAuth2Client.setCredentials(token);

        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) {
            return reject(err);
          }

          logger.info(
            "🐑 Google Sheets",
            `Token stored to ${TOKEN_PATH}`
          );
        });

        resolve(oAuth2Client);
      });
    });
  });
}

function getSpreadsheetRows(options) {
  return getGoogleOAuth2Client().then((oAuth2Client) => {
    return new Promise((resolve, reject) => {
      const sheets = google.sheets({
        version: "v4",
        auth: oAuth2Client,
      });

      sheets.spreadsheets.values.get(options, (err, res) => {
        if (err) {
          throw reject(err);
        }

        const rows = res.data.values;

        if (!rows || rows.length === 0) {
          throw reject(new Error("No data found in spreadsheet..."));
        }

        return resolve(rows);
      });
    });
  });
}

module.exports = {
  getSpreadsheetRows,
};
