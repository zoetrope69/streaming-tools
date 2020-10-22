const fs = require("fs");
const fetch = require("node-fetch");
const { stringify: queryStringStringify } = require("qs");

const {
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  TWITCH_BROADCASTER_ID,
} = process.env;

const getOauthToken = () => {
  const queryString = queryStringStringify({
    client_id: TWITCH_CLIENT_ID,
    client_secret: TWITCH_CLIENT_SECRET,
    grant_type: "client_credentials",
  });
  const url = ` https://id.twitch.tv/oauth2/token?${queryString}`;

  return fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.twitchtv.v5+json",
    },
  })
    .then((response) => response.json())
    .then((response) => {
      if (!response.access_token) {
        throw new Error("No access token.");
      }

      return response.access_token;
    });
};

const getStreamTitle = (accessToken) => {
  const queryString = queryStringStringify({
    user_id: TWITCH_BROADCASTER_ID,
  });
  const url = `https://api.twitch.tv/helix/streams?${queryString}`;

  return fetch(url, {
    headers: {
      Accept: "application/vnd.twitchtv.v5+json",
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": TWITCH_CLIENT_ID,
    },
  })
    .then((response) => response.json())
    .then((response) => {
      if (!response.data || response.data.length === 0) {
        return "";
      }

      return response.data[0].title;
    });
};

const writeToFile = (content) => {
  console.log("updating stream title to:", content);
  fs.writeFile("../stream-title.txt", content, (err) => {
    if (err) {
      throw new Error(err);
    }
  });
};

const main = () =>
  getOauthToken()
    .then(getStreamTitle)
    .then(writeToFile)
    .catch(console.error);

module.exports = main;
