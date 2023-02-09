import fetch from "node-fetch";
import { stringify as queryStringStringify } from "qs";

import getUserPronouns from "./helpers/pronouns.js";
import getAccessToken from "../helpers/oauth.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("💩 Twitch API");

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
    throw new Error(json.message);
  }

  if (!json) {
    throw new Error(`No data for: ${url}`);
  }

  return json;
}

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
  const { id, display_name, profile_image_url } = userData;

  return {
    id,
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

async function setChannelInfo({ category, title }) {
  const newChannelInfo = {};

  if (category) {
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

async function getTags() {
  const response = await callTwitchAPI({
    endpoint: "streams/tags",
    options: {
      broadcaster_id: TWITCH_BROADCASTER_ID,
    },
  });

  const { data } = response;

  if (!data || data.length === 0) {
    return [];
  }

  return data;
}

async function setTags(tagIds = []) {
  const response = await callTwitchAPI({
    endpoint: "streams/tags",
    options: {
      broadcaster_id: TWITCH_BROADCASTER_ID,
    },
    fetchOptions: {
      method: "PUT",
      body: JSON.stringify({ tag_ids: tagIds }),
    },
  });

  const { data } = response;

  if (!data || data.length === 0) {
    return null;
  }

  return data;
}

async function searchCategories(query) {
  const response = await callTwitchAPI({
    endpoint: "search/categories",
    options: {
      query,
    },
  });

  const { data } = response;

  if (!data || data.length === 0) {
    return [];
  }

  return data;
}

async function getStream() {
  const response = await callTwitchAPI({
    endpoint: "streams",
    options: {
      first: 1,
      user_id: TWITCH_BROADCASTER_ID,
    },
  });

  const { data } = response;

  if (!data || data.length === 0) {
    return null;
  }

  return data[0];
}

async function getViewerCount() {
  const stream = await getStream();

  if (!stream || typeof stream.viewer_count === "undefined") {
    return null;
  }

  return stream.viewer_count;
}

async function getRedemptions() {
  const response = await callTwitchAPI({
    endpoint: "channel_points/custom_rewards",
    options: {
      broadcaster_id: TWITCH_BROADCASTER_ID,
      only_manageable_rewards: true,
    },
  });

  const { data } = response;

  if (!data || data.length === 0) {
    return [];
  }

  return data;
}

async function createRedemption(redemption) {
  const response = await callTwitchAPI({
    endpoint: "channel_points/custom_rewards",
    options: {
      broadcaster_id: TWITCH_BROADCASTER_ID,
    },
    fetchOptions: {
      method: "POST",
      body: JSON.stringify(redemption),
    },
  });

  const { data } = response;

  if (!data || data.length === 0) {
    return {};
  }

  const { title, id } = data[0];

  logger.error(`Update redemption "${title}" with id "${id}"`);

  return data;
}

async function updateRedemption(redemption) {
  return await callTwitchAPI({
    endpoint: "channel_points/custom_rewards",
    options: {
      broadcaster_id: TWITCH_BROADCASTER_ID,
      id: redemption.id,
    },
    fetchOptions: {
      method: "PATCH",
      body: JSON.stringify(redemption),
    },
  });
}

async function deleteRedemption(id) {
  return await callTwitchAPI({
    endpoint: "channel_points/custom_rewards",
    options: {
      broadcaster_id: TWITCH_BROADCASTER_ID,
      id,
    },
    fetchOptions: {
      method: "DELETE",
    },
  });
}

async function updateRedemptionReward(redemption, status) {
  const { id, reward } = redemption;
  return await callTwitchAPI({
    endpoint: "channel_points/custom_rewards/redemptions",
    options: {
      broadcaster_id: TWITCH_BROADCASTER_ID,
      id,
      reward_id: reward.id,
    },
    fetchOptions: {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  });
}

async function sendChatAnnouncement(message, color = "primary") {
  try {
    return await callTwitchAPI({
      endpoint: "chat/announcements",
      options: {
        broadcaster_id: TWITCH_BROADCASTER_ID,
        moderator_id: TWITCH_BROADCASTER_ID,
      },
      fetchOptions: {
        method: "POST",
        body: JSON.stringify({
          message,
          color,
        }),
      },
    });
  } catch (e) {
    logger.error(`Failed to do announcement`);
    console.error(e); // eslint-disable-line no-console
  }
}

async function sendChatShoutout(user) {
  try {
    return await callTwitchAPI({
      endpoint: "chat/shoutouts",
      options: {
        from_broadcaster_id: TWITCH_BROADCASTER_ID,
        to_broadcaster_id: user.id,
        moderator_id: TWITCH_BROADCASTER_ID,
      },
      fetchOptions: {
        method: "POST",
      },
    });
  } catch (e) {
    logger.error(`Failed to shoutout ${user}`);
    console.error(e); // eslint-disable-line no-console
  }
}

async function updateChatSettings(settings) {
  try {
    return await callTwitchAPI({
      endpoint: "chat/settings",
      options: {
        broadcaster_id: TWITCH_BROADCASTER_ID,
        moderator_id: TWITCH_BROADCASTER_ID,
      },
      fetchOptions: {
        method: "PATCH",
        body: JSON.stringify(settings),
      },
    });
  } catch (e) {
    logger.error(`Failed to update chat settings`);
    console.error(e); // eslint-disable-line no-console
  }
}

async function TwitchAPI({ ngrokUrl }) {
  return {
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

    setCategory: async (categoryQuery) => {
      const categories = await searchCategories(categoryQuery);

      if (!categories || categories.length === 0) {
        throw new Error(
          `Couldn't find a category from "${categoryQuery}"`
        );
      }

      const exactMatchedCategory = categories.find((category) => {
        return (
          category.name.toLowerCase() === categoryQuery.toLowerCase()
        );
      });

      if (exactMatchedCategory) {
        return setChannelInfo({ category: exactMatchedCategory });
      }

      return setChannelInfo({ category: categories[0] });
    },

    setTitle: async (title) => {
      return setChannelInfo({ title });
    },

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

    setTags: async (newTagIds = []) => {
      const tags = await getTags();
      const nonAutoTags = tags.filter((tag) => tag.is_auto === false);
      const tagIds = nonAutoTags.map((tag) => tag.tag_id);

      return setTags([...new Set([...tagIds, ...newTagIds])]);
    },

    getRedemptions,

    createRedemption,

    deleteRedemption,

    updateRedemption,

    disableRedemption: async (id) => {
      return updateRedemption({
        id,
        is_enabled: false,
      });
    },

    enableRedemption: async (id) => {
      return updateRedemption({
        id,
        is_enabled: true,
      });
    },

    updateRedemptionReward,

    fulfilRedemptionReward: async (redemption) => {
      try {
        await updateRedemptionReward(redemption, "FULFILLED");
      } catch (e) {
        logger.debug(e.message);
      }
    },

    cancelRedemptionReward: async (redemption) => {
      try {
        await updateRedemptionReward(redemption, "CANCELED");
      } catch (e) {
        logger.debug(e.message);
      }
    },

    getStream,

    getViewerCount,

    sendChatAnnouncement,

    sendChatShoutout,

    updateChatSettings,
  };
}

export default TwitchAPI;
