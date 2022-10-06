import { EventEmitter } from "events";

import fetch from "node-fetch";
import { stringify as queryStringStringify } from "qs";

import getAccessToken from "../helpers/oauth.js";

import Logger from "../helpers/logger.js";
const logger = new Logger("▶️ Official YouTube API");

const BASE_URL = "https://www.googleapis.com/youtube/v3";

async function callEndpoint(
  endpoint,
  queryParams = {},
  options = {}
) {
  const { accessToken } = await getAccessToken({ type: "youtube" });

  const queryString = queryStringStringify({
    ...queryParams,
  });

  const response = await fetch(
    `${BASE_URL}${endpoint}?${queryString}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      ...options,
    }
  );

  // No Content
  if (response.status === 204) {
    return {};
  }

  const json = await response.json();

  if (response.status !== 200) {
    if (json.error) {
      logger.error(json.error);
      throw new Error(json.error.message);
    }

    throw new Error(response.statusText);
  }

  if (json.error) {
    throw new Error(json.error.message);
  }

  return json;
}

async function getLiveBroadcast() {
  const response = await callEndpoint("/liveBroadcasts", {
    part: "id,snippet,status",
    mine: true,
  });

  const broadcasts = response.items;

  if (!response.items || response.items.length === 0) {
    return null;
  }

  const liveBroadcast = broadcasts.find(
    (broadcast) => broadcast.status.lifeCycleStatus === "live"
  );

  return {
    id: liveBroadcast.id,
    ...liveBroadcast.snippet,
  };
}

class OfficialYouTubeAPI extends EventEmitter {
  constructor() {
    super();

    this.liveBroadcast = null;
    this.liveBroadcastTimeout = null;

    this.getLiveBroadcast();
  }

  async getLiveBroadcast() {
    this.liveBroadcast = await getLiveBroadcast();

    if (this.liveBroadcast) {
      logger.info(`Connected`);
      this.emit("connected", this.liveBroadcast);
      if (this.liveBroadcastTimeout) {
        clearTimeout(this.liveBroadcastTimeout);
      }
    } else {
      logger.info("Waiting to poll for live broadcast...");
      this.liveBroadcastTimeout = setTimeout(() => {
        this.getLiveBroadcast();
      }, 30 * 1000);
    }
  }

  onConnected(callback) {
    if (this.liveBroadcast) {
      callback();
      return;
    }

    this.on("connected", callback);
  }
}

export default OfficialYouTubeAPI;
