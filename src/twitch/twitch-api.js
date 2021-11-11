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

const DEFAULT_REDEMPTION = {
  is_enabled: true,
  is_user_input_required: false,
  is_global_cooldown_enabled: false,
  global_cooldown_seconds: 0,
  is_paused: false,
  should_redemptions_skip_request_queue: true,
};

const REDEMPTIONS = [
  {
    ...DEFAULT_REDEMPTION,
    id: "1970bc27-8ffa-4cfd-ade3-ded68bb893c7",
    title: "dance with zac",
    prompt: "pop-up on the stream as a little blob bopping",
    cost: 5,
    background_color: "#002224",
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "f75ae948-4d4d-41a1-94c5-76315bc2bcb7",
    title: "dance to a song",
    prompt:
      "you can suggest something, but i have the executive decision",
    cost: 5,
    background_color: "#C2F9FD",
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "3c3b6573-8de4-4adb-8187-8f760cafdb7e",
    title: "show your pride",
    prompt:
      "agender, aromantic, asexual, bisexual, gay, genderfluid, genderqueer, intersex, lesbian, non-binary, pansexual, polysexual, transgender - one missing? let me know",
    cost: 10,
    background_color: "#E7E7E7",
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "7de7d543-cf2f-434f-a319-eba5fd4e1496",
    title: "snowball",
    prompt: "throw a club penguin snowball at me face",
    cost: 20,
    background_color: "#D5E4E7",
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "975f6903-f026-4112-988a-a13d03a78049",
    title: "imma bee",
    prompt: "imma bee imma bee imma bee imma bee imma bee imma bee",
    cost: 300,
    background_color: "#FFF400",
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "fc929918-95d5-4b79-9697-c4f6d8c36d13",
    title: "big drink",
    prompt: "it's time to hydrate",
    cost: 50,
    background_color: "#1E92FA",
    should_redemptions_skip_request_queue: false,
    is_global_cooldown_enabled: true,
    global_cooldown_seconds: 60 * 10, // 10 minutes
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "d20463be-3f02-490d-87d8-ea600e450857",
    title: "zac u stink",
    prompt: "get stevesey to tell me i stinky :-(",
    cost: 50,
    background_color: "#2B5323",
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "a102d4bc-570b-483b-b060-b5a8c99fd5f6",
    title: "big data",
    prompt:
      "google, facebook gonna f about with our data but... maybe i could be swayed...",
    cost: 500,
    background_color: "#A42688",
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "1d8c3308-035b-4466-adae-8cc5726bac26",
    title: "ally phil",
    prompt:
      "if phil removes something that isn't bigotry you will be warned/banned",
    cost: 120,
    background_color: "#052DA5",
    is_user_input_required: true,
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "8ad56fc6-f597-433c-b388-8e47ba23bc56",
    title: "pog",
    prompt:
      "now that, that right there is what we call pog on twitch",
    cost: 100,
    background_color: "#F4FF6B",
    is_global_cooldown_enabled: true,
    global_cooldown_seconds: 60 * 1, // 1 minutes
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "6b8cc18a-f927-41fd-9dbf-aca27fd1f0ec",
    title: "goosebumpz book",
    prompt: "only put in one or two words. e.g carrot cake",
    cost: 100,
    background_color: "#00C7AC",
    should_redemptions_skip_request_queue: false,
    is_user_input_required: true,
    is_global_cooldown_enabled: true,
    global_cooldown_seconds: 60 * 4, // 4 minutes
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "824b91da-d234-441f-bc55-0b1a148463b5",
    title: "brendan takeover",
    prompt: "mr fraiser takes over for a bit",
    cost: 200,
    background_color: "#B50028",
    should_redemptions_skip_request_queue: false,
    is_global_cooldown_enabled: true,
    global_cooldown_seconds: 60 * 5, // 5 minutes
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "4de612a1-1fea-40cd-a105-b40d4f8fcb00",
    title: "norty devil",
    prompt: "show one of EggEllie's norty devil artworks",
    cost: 666,
    background_color: "#000000",
    is_global_cooldown_enabled: true,
    global_cooldown_seconds: 60 * 1, // 1 minutes
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "e7159fe0-237e-4271-ae3a-680dd3abe928",
    title: "runescape",
    prompt:
      "show runescape text on the screen - !runescape of how to customise text",
    cost: 300,
    background_color: "#8B4BA8",
    is_user_input_required: true,
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "910b17fe-7a87-4a2a-860e-54cdf56b73e4",
    title: "BroomyJagRace",
    prompt: "start your broomers",
    cost: 800,
    background_color: "#FFFFFF",
    should_redemptions_skip_request_queue: false,
    is_global_cooldown_enabled: true,
    global_cooldown_seconds: 60 * 30, // 30 minutes
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "219a26d4-587e-417d-bd80-2cb2cbe5e86d",
    title: "barry",
    cost: 1111,
    background_color: "#05B33E",
    should_redemptions_skip_request_queue: false,
    is_global_cooldown_enabled: true,
    global_cooldown_seconds: 60 * 5, // 5 minutes
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "1bcb37f6-fbe0-4cb6-8c9d-7303c0fa2aa1",
    title: "ewww this song is doo doo",
    prompt: "skip the song",
    cost: 800,
    background_color: "#333333",
    should_redemptions_skip_request_queue: false,
    is_global_cooldown_enabled: true,
    global_cooldown_seconds: 60 * 5, // 5 minutes
  },
  {
    ...DEFAULT_REDEMPTION,
    id: "48d766ce-4d60-4147-8ee1-5eac45a7acd1",
    title: "bubblewrap time",
    prompt: "lets pop bubbles together",
    cost: 80,
    background_color: "#131E5B",
    should_redemptions_skip_request_queue: false,
    is_global_cooldown_enabled: true,
    global_cooldown_seconds: 60 * 1, // 1 minutes
  },
];

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

async function updateRedemptionReward(
  redemption,
  fulfilledOrCancelled = true
) {
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
      body: JSON.stringify({
        status: fulfilledOrCancelled ? "FULFILLED" : "CANCELED ",
      }),
    },
  });
}

function hasRedemptionChanged(existingRedemption, redemption) {
  let hasChanged = false;

  Object.keys(redemption).forEach((key) => {
    if (
      !Object.prototype.hasOwnProperty.call(existingRedemption, key)
    ) {
      return;
    }

    if (existingRedemption[key] !== redemption[key]) {
      hasChanged = true;
    }
  });

  return hasChanged;
}

async function syncRedemptions() {
  let existingRedemptions = await getRedemptions();

  // delete any removed rewards
  const redemptionDeletions = [];
  existingRedemptions.forEach(async (existingRedemption) => {
    const matchedExpectedRedemptions = REDEMPTIONS.find(
      (redemption) => {
        return redemption.id === existingRedemption.id;
      }
    );

    if (!matchedExpectedRedemptions) {
      logger.debug(
        `Deleting redemption "${existingRedemption.title}"`
      );
      redemptionDeletions.push(
        deleteRedemption(existingRedemption.id)
      );
    }
  });
  await Promise.all(redemptionDeletions);

  existingRedemptions = await getRedemptions();

  const redemptionUpdatesAndCreations = [];
  REDEMPTIONS.forEach((redemption) => {
    const matchedExistingRedemption = existingRedemptions.find(
      (existingRedemption) => {
        return existingRedemption.id === redemption.id;
      }
    );

    // found a reward, update
    if (matchedExistingRedemption) {
      if (
        hasRedemptionChanged(matchedExistingRedemption, redemption)
      ) {
        logger.debug(`Updating redemption "${redemption.title}"`);
        redemptionUpdatesAndCreations.push(
          updateRedemption(redemption)
        );
      }

      return;
    }

    // no reward, create it
    logger.debug(`Creating redemption "${redemption.title}"`);
    redemptionUpdatesAndCreations.push(createRedemption(redemption));
  });
  await Promise.all(redemptionUpdatesAndCreations);
}

async function TwitchAPI({ ngrokUrl }) {
  await syncRedemptions();

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

    disableRedemption: async (redemptionName) => {
      const redemption = REDEMPTIONS.find(
        (redemption) => redemption.title === redemptionName
      );
      if (!redemption) {
        return;
      }

      return updateRedemption({
        ...redemption,
        is_enabled: false,
      });
    },

    enableRedemption: async (redemptionName) => {
      const redemption = REDEMPTIONS.find(
        (redemption) => redemption.title === redemptionName
      );
      if (!redemption) {
        return;
      }

      return updateRedemption({
        ...redemption,
        is_enabled: true,
      });
    },

    updateRedemptionReward,
  };
}

module.exports = TwitchAPI;
