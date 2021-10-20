const fetch = require("node-fetch");
const { stringify: queryStringStringify } = require("qs");

const Logger = require("../helpers/logger");
const logger = new Logger("💩 Twitch API");

const getUserPronouns = require("./helpers/pronouns");
const { getAccessToken } = require("../helpers/oauth");

const {
  TWITCH_CLIENT_ID,
  TWITCH_BROADCASTER_ID,
  TWITCH_EVENTSUB_SECRET,
} = process.env;

async function callTwitchAPI({
  endpoint,
  options,
  fetchOptions,
  type = "twitch",
}) {
  const { accessToken } = await getAccessToken({ type });
  const queryString = queryStringStringify(options);
  const url = `https://api.twitch.tv/helix/${endpoint}?${queryString}`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/vnd.twitchtv.v5+json",
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": TWITCH_CLIENT_ID,
        "Content-Type": "application/json",
      },
      ...fetchOptions,
    });
  } catch (e) {
    logger.error(e.message || e);
  }

  if (!response) {
    return {};
  }

  const rateLimit = response.headers.get("ratelimit-limit");
  const rateLimitRemaining = response.headers.get(
    "ratelimit-remaining"
  );

  if (rateLimitRemaining / rateLimit < 0.33) {
    logger.error(
      `Twitch API Call Rate limit: ${rateLimitRemaining}/${rateLimit}`
    );
  }

  // no content
  if (response.status === 204) {
    return {};
  }

  const json = await response.json();

  if (json.error) {
    logger.error(json.message);
  }

  if (!json) {
    logger.error(`No data for: ${url}`);
    return;
  }

  return json;
}

async function TwitchAPI({ ngrokUrl }) {
  async function getUser(username) {
    const response = await callTwitchAPI({
      endpoint: "users",
      options: {
        login: username,
      },
    });

    if (!response || !response.data || response.data.length === 0) {
      return null;
    }

    const [userData] = response.data;
    const { display_name, profile_image_url } = userData;

    return {
      username: display_name,
      image: profile_image_url,
    };
  }

  async function getChannelInfo() {
    const response = await callTwitchAPI({
      endpoint: "channels",
      options: {
        broadcaster_id: TWITCH_BROADCASTER_ID,
      },
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

  async function getCategoryByName(searchName) {
    const response = await callTwitchAPI({
      endpoint: "games",
      options: {
        name: searchName,
      },
    });

    const { data } = response;

    if (!data || data.length === 0) {
      return {};
    }

    const { id, name, box_art_url } = data[0];

    return {
      id,
      name,
      image: box_art_url,
    };
  }

  async function setChannelInfo({ categoryName, title }) {
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

    return callTwitchAPI({
      endpoint: "channels",
      options: {
        broadcaster_id: TWITCH_BROADCASTER_ID,
      },
      fetchOptions: {
        method: "PATCH",
        body: JSON.stringify(newChannelInfo),
      },
    });
  }

  async function getEventSubSubscriptions() {
    const response = await callTwitchAPI({
      endpoint: "eventsub/subscriptions",
      type: "twitch-app",
    });

    const { data } = response;

    if (!data || data.length === 0) {
      return [];
    }

    return data;
  }

  async function createEventSubSubscription({ type, ngrokUrl }) {
    const response = await callTwitchAPI({
      endpoint: "eventsub/subscriptions",
      fetchOptions: {
        method: "POST",
        body: JSON.stringify({
          type,
          version: "1",
          condition: {
            broadcaster_user_id: TWITCH_BROADCASTER_ID,
          },
          transport: {
            method: "webhook",
            callback: `${ngrokUrl}/eventSubCallback`,
            secret: TWITCH_EVENTSUB_SECRET,
          },
        }),
      },
      type: "twitch-app",
    });

    const { data } = response;

    if (!data || data.length === 0) {
      return {};
    }

    return data;
  }

  async function deleteEventSubSubscription({ id }) {
    const response = await callTwitchAPI({
      endpoint: "eventsub/subscriptions",
      options: { id },
      fetchOptions: {
        method: "DELETE",
      },
      type: "twitch-app",
    });

    const { data } = response;

    if (!data || data.length === 0) {
      return {};
    }

    return data;
  }

  async function getGlobalEmotes() {
    const response = await callTwitchAPI({
      endpoint: "chat/emotes/global",
    });

    const { data } = response;

    if (!data || data.length === 0) {
      return {};
    }

    return data;
  }

  async function getChannelEmotes() {
    const response = await callTwitchAPI({
      endpoint: "chat/emotes",
      options: {
        broadcaster_id: TWITCH_BROADCASTER_ID,
      },
    });

    const { data } = response;

    if (!data || data.length === 0) {
      return {};
    }

    return data;
  }

  async function getEmotes() {
    const channelEmotes = await getChannelEmotes();
    const globalEmotes = await getGlobalEmotes();

    return [...channelEmotes, ...globalEmotes].map((emote) => {
      return {
        id: emote.id,
        code: emote.name,
        image: emote?.images?.url_4x,
      };
    });
  }

  return {
    getOAuthToken,

    getUser: async (username) => {
      const user = await getUser(username);

      if (!user) {
        return null;
      }

      const pronouns = await getUserPronouns(user.username);

      return {
        ...user,
        pronouns,
      };
    },

    getChannelInfo,

    setChannelInfo,

    eventSub: {
      getSubscriptions: async () => getEventSubSubscriptions(),
      subscribe: async (type) => {
        return createEventSubSubscription({
          type,
          ngrokUrl,
        });
      },
      unsubscribe: async (id) => {
        return deleteEventSubSubscription({ id });
      },
    },

    getEmotes,
  };
}

module.exports = TwitchAPI;
