const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { prompt } = require("enquirer");
const {
  markdownToTxt: markdownToPlainText,
} = require("markdown-to-txt");

const logger = require("../helpers/logger");

const BASE_URL = "https://glimesh.tv/api";
const REFRESH_TOKEN_PATH = path.join(
  __dirname,
  "/glimesh-refresh-token.json"
);

async function queryAPI(accessToken, query) {
  const response = await fetch(`${BASE_URL}/graph`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query }),
  });
  return response.json();
}

const AUTH_SCOPES = [
  "public",
  // "email",
  "chat",
  // "streamkey"
];

let {
  refreshToken: GLIMESH_REFRESH_TOKEN,
} = require(REFRESH_TOKEN_PATH);

function saveRefreshTokenToFile(refreshToken) {
  GLIMESH_REFRESH_TOKEN = refreshToken;
  const jsonString = JSON.stringify({ refreshToken }, null, 2);
  fs.writeFile(REFRESH_TOKEN_PATH, jsonString, (error) => {
    if (error) {
      return logger.error("▶️ Glimesh", error);
    }
  });
}

const {
  GLIMESH_REDIRECT_URL,
  GLIMESH_CLIENT_ID,
  GLIMESH_CLIENT_SECRET,
  GLIMESH_BROADCASTER_ID,
  GLIMESH_BROADCASTER_NAME,
} = process.env;

function createAuthURL() {
  const queryParams = new URLSearchParams({
    response_type: "code",
    client_id: GLIMESH_CLIENT_ID,
    scope: AUTH_SCOPES.join(" "),
    redirect_uri: GLIMESH_REDIRECT_URL,
  });

  return `https://glimesh.tv/oauth/authorize?${queryParams}`;
}

async function getAuthCodeFromCommandLineUrl() {
  const response = await prompt({
    type: "input",
    name: "url",
    message: "Redirected URL",
  });

  if (response.url.trim().length === 0) {
    throw new Error("No URL sent");
  }

  let url;
  try {
    url = new URL(response.url);
  } catch (e) {
    throw new Error("Invalid URL");
  }
  const code = url.searchParams.get("code");

  if (!code) {
    throw new Error("No code in URL");
  }

  return code;
}

async function getRefreshTokenFromAuthCode({ authCode }) {
  const url = `${BASE_URL}/oauth/token`;
  const response = await fetch(url, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: GLIMESH_REDIRECT_URL,
      client_id: GLIMESH_CLIENT_ID,
      client_secret: GLIMESH_CLIENT_SECRET,
    }),
  });

  const json = await response.json();

  if (json.error) {
    throw new Error(`[${json.error}] ${json.error_description}`);
  }

  return json;
}

async function getAccessTokenWithRefreshToken() {
  const url = `${BASE_URL}/oauth/token`;

  const response = await fetch(url, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: GLIMESH_REFRESH_TOKEN,
      redirect_url: GLIMESH_REDIRECT_URL,
      client_id: GLIMESH_CLIENT_ID,
      client_secret: GLIMESH_CLIENT_SECRET,
      scope: AUTH_SCOPES.join(" "),
    }),
  });

  const json = await response.json();

  if (json.error) {
    if (json.error === "invalid_refresh_token") {
      logger.info(
        "▶️ Glimesh",
        `⚠ Can't authorize Glimesh ${createAuthURL()}`
      );

      const authCode = await getAuthCodeFromCommandLineUrl();
      const newJson = await getRefreshTokenFromAuthCode({ authCode });

      if (!newJson.refresh_token) {
        throw new Error("No refresh token");
      }

      saveRefreshTokenToFile(newJson.refresh_token);

      return newJson.access_token;
    }

    throw new Error(`[${json.error}] ${json.error_description}`);
  }

  if (!json.refresh_token) {
    throw new Error("No refresh token");
  }

  saveRefreshTokenToFile(json.refresh_token);

  return json.access_token;
}

async function GlimeshAPI() {
  const accessToken = await getAccessTokenWithRefreshToken();

  async function getChannelInfo() {
    const query = await queryAPI(
      accessToken,
      `
      query {
        channel(streamerUsername: "${GLIMESH_BROADCASTER_NAME}") {
          category {
            id
            name
          }
          language
          title
          streamer {
            id
            displayname
          }
        }
      }
      `
    );

    const { category, language, title } = query.data.channel;

    return {
      id: GLIMESH_BROADCASTER_ID,
      username: GLIMESH_BROADCASTER_NAME,
      title,
      language,
      categoryId: category.id,
      categoryName: category.name,
    };
  }

  async function getUser(username) {
    const query = await queryAPI(
      accessToken,
      `
        query {
          user(username: "${username}") {
            avatarUrl
            displayname
            profileContentMd
          }
        }
      `
    );

    const { avatarUrl, displayname, profileContentMd } =
      query.data.user;

    return {
      username: displayname,
      description: profileContentMd
        ? markdownToPlainText(profileContentMd).trim()
        : null,
      image: avatarUrl,
      pronouns: null, // No way to get these yet
    };
  }

  async function getModerators() {
    const query = await queryAPI(
      accessToken,
      `
      query {
        channel(streamerUsername: "${GLIMESH_BROADCASTER_NAME}") {
          moderators {
            edges {
              node {
                user {
                  username
                }
              }
            }
          }
        }
      }
    `
    );
    return query.data.channel.moderators.edges
      .map((item) => item.node)
      .map(({ user }) => user.username);
  }

  async function getFollowTotal() {
    const query = await queryAPI(
      accessToken,
      `
      query {
        user(username: "${GLIMESH_BROADCASTER_NAME}") {
         countFollowers
        }
      }
      `
    );

    return query.data.user.countFollowers;
  }
  return {
    getAccessToken: () => accessToken,
    getModerators,
    getUser,
    getFollowTotal,
    getChannelInfo,
    getCustomShoutOuts: () => [], // not implemented
  };
}

// await twitch.setChannelInfo({ title: newTitle });
// twitch.on('channelInfo')
// twitch.on('follow') <-
// twitch.bot.timeout

module.exports = GlimeshAPI;
