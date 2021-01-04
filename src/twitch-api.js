const fetch = require("node-fetch");
const { stringify: queryStringStringify } = require("qs");

const logger = require("./helpers/logger");

const {
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  TWITCH_BROADCASTER_ID,
} = process.env;

async function getOAuthToken() {
  const queryString = queryStringStringify({
    client_id: TWITCH_CLIENT_ID,
    client_secret: TWITCH_CLIENT_SECRET,
    grant_type: "client_credentials",
  });
  const url = ` https://id.twitch.tv/oauth2/token?${queryString}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.twitchtv.v5+json",
    },
  });

  const json = await response.json();
  if (!json.access_token) {
    throw new Error("No access token.");
  }

  return json.access_token;
}

function callTwitchAPIBuilder(oAuthToken) {
  return async function (endpoint, options, fetchOptions) {
    const queryString = queryStringStringify(options);
    const url = `https://api.twitch.tv/helix/${endpoint}?${queryString}`;

    let response;
    try {
      response = await fetch(url, {
        headers: {
          Accept: "application/vnd.twitchtv.v5+json",
          Authorization: `Bearer ${oAuthToken}`,
          "Client-Id": TWITCH_CLIENT_ID,
          "Content-Type": "application/json",
        },
        ...fetchOptions,
      });
    } catch (e) {
      logger.error("💩 Twitch API", e);
    }

    if (!response) {
      return;
    }

    const rateLimit = response.headers.get("ratelimit-limit");
    const rateLimitRemaining = response.headers.get(
      "ratelimit-remaining"
    );

    if (rateLimitRemaining / rateLimit < 0.33) {
      logger.error(
        "💩 Twitch API",
        `Twitch API Call Rate limit: ${rateLimitRemaining}/${rateLimit}`
      );
    }

    const json = await response.json();

    if (!json) {
      logger.error("💩 Twitch API", `No data for: ${url}`);
      return;
    }

    return json;
  };
}

async function getUser(callTwitchAPI, username) {
  const response = await callTwitchAPI("users", {
    login: username,
  });

  if (!response || !response.data || response.data.length === 0) {
    return null;
  }

  const [userData] = response.data;
  const { description, display_name, profile_image_url } = userData;

  return {
    username: display_name,
    description,
    image: profile_image_url,
  };
}

async function getFollowers(callTwitchAPI) {
  const response = await callTwitchAPI("users/follows", {
    to_id: TWITCH_BROADCASTER_ID,
  });

  const { data, total } = response;

  if (!data || data.length === 0) {
    return { total: null, followers: [] };
  }

  const followers = data.map(
    ({ from_id, from_name, followed_at }) => ({
      id: from_id,
      username: from_name,
      followed_at,
    })
  );

  return {
    total,
    followers,
  };
}

async function getChannelInfo(callTwitchAPI) {
  const response = await callTwitchAPI("channels", {
    broadcaster_id: TWITCH_BROADCASTER_ID,
  });

  const { data } = response;

  if (!data || data.length === 0) {
    return {};
  }

  const {
    broadcaster_id,
    broadcaster_name,
    broadcaster_language,
    title,
    game_id,
    game_name,
  } = data[0];

  return {
    id: broadcaster_id,
    username: broadcaster_name,
    title,
    language: broadcaster_language,
    categoryId: game_id,
    categoryName: game_name,
  };
}

async function getCategoryByName(callTwitchAPI, searchName) {
  const response = await callTwitchAPI("games", { name: searchName });

  const { data } = response;

  if (!data || data.length === 0) {
    return {};
  }

  const { id, name, box_art_url } = data[0];
  console.log(data);
  return {
    id,
    name,
    image: box_art_url,
  };
}

async function setChannelInfo(
  callTwitchAPI,
  { categoryName, title }
) {
  const newChannelInfo = {};

  if (categoryName) {
    const category = await getCategoryByName(categoryName);
    if (!category) {
      throw new Error(`${categoryName} isn't a category/game...`);
    }

    newChannelInfo.game_id = category.id;
  }

  if (title) {
    newChannelInfo.title = title;
  }

  return callTwitchAPI(
    "channels",
    {
      broadcaster_id: TWITCH_BROADCASTER_ID,
    },
    {
      method: "PATCH",
      body: JSON.stringify(newChannelInfo),
    }
  );
}

async function TwitchAPI() {
  const oAuthToken = await getOAuthToken();
  const callTwitchAPI = callTwitchAPIBuilder(oAuthToken);

  return {
    getOAuthToken,

    getUser: async (username) => {
      return getUser(callTwitchAPI, username);
    },

    getFollowTotal: async () => {
      const { total } = await getFollowers(callTwitchAPI);
      return total;
    },

    getChannelInfo: async () => getChannelInfo(callTwitchAPI),

    setChannelInfo: async ({ categoryName, title }) => {
      return setChannelInfo(callTwitchAPI, { categoryName, title });
    },
  };
}

module.exports = TwitchAPI;
