import OBSWebSocket from "obs-websocket-js";

import Logger from "../helpers/logger.js";
const logger = new Logger("☢ OBS");

const obsWebSocket = new OBSWebSocket();

const {
  WINDOWS_IP_ADDRESS,
  OBS_WEBSOCKET_ADDRESS_PORT,
  OBS_WEBSOCKET_PASSWORD,
} = process.env;

let OBS_INITIALISED = false;
let AVAILABLE_OBS_REQUESTS = [];

export async function request(requestName, options) {
  if (!OBS_INITIALISED) {
    logger.error(`Error for ${requestName} request`);
    throw new Error("OBS isn't ready");
  }

  if (!AVAILABLE_OBS_REQUESTS.includes(requestName)) {
    logger.debug("AVAILABLE_OBS_REQUESTS", AVAILABLE_OBS_REQUESTS);
    logger.debug(
      ["Available requests:", ...AVAILABLE_OBS_REQUESTS].join("\n")
    );
    const requestError = new Error(
      `"${requestName}" is not an available request.`
    );
    logger.error(requestError);
    return Promise.reject(requestError);
  }

  let response = {};
  try {
    response = await obsWebSocket.send(requestName, options);
  } catch (exception) {
    logger.error(`Error for ${requestName} request`);
    logger.error(exception || exception.message);

    if (exception.error === "specified source doesn't exist") {
      logger.error(`"${options?.sourceName}" doesn't exist`);
    }
  }

  return response;
}

export async function initialise() {
  logger.info("Connecting...");

  return new Promise((resolve) => {
    if (OBS_INITIALISED) {
      return resolve();
    }

    try {
      obsWebSocket.connect({
        address: `${WINDOWS_IP_ADDRESS}:${OBS_WEBSOCKET_ADDRESS_PORT}`,
        password: OBS_WEBSOCKET_PASSWORD,
      });
    } catch (e) {
      logger.error(e.error || e.message || e);
    }

    obsWebSocket.on("ConnectionClosed", (data) =>
      logger.debug("OBS connection closed", data)
    );

    obsWebSocket.on("AuthenticationFailure", (data) =>
      logger.error("OBS Failed to authenticate", data)
    );

    obsWebSocket.on("ConnectionOpened", async () => {
      obsWebSocket.on("AuthenticationSuccess", async () => {
        let versionInfo;
        try {
          versionInfo = await obsWebSocket.send("GetVersion");
        } catch (e) {
          logger.error(e.error || e.message || e);
        }

        if (!versionInfo) {
          return logger.error("No version info");
        }

        logger.info("Connected!");

        AVAILABLE_OBS_REQUESTS =
          versionInfo.availableRequests.split(",");
        logger.info(`Version ${versionInfo.obsStudioVersion}`);
        logger.info(
          `obs-websocket version ${versionInfo.obsWebsocketVersion}`
        );

        OBS_INITIALISED = true;

        // reset any triggers
        resetTriggers();

        return resolve();
      });
    });
  });
}

export async function getWebcamImage(sourceName) {
  if (!OBS_INITIALISED) {
    throw new Error("OBS isn't ready");
  }

  let webcamScreenshot;
  try {
    webcamScreenshot = await request("TakeSourceScreenshot", {
      sourceName,
      embedPictureFormat: "png",
    });
  } catch (e) {
    throw new Error(e.error || e);
  }

  return webcamScreenshot?.img;
}

export async function getCurrentScene() {
  if (!OBS_INITIALISED) {
    throw new Error("OBS isn't ready");
  }

  return request("GetCurrentScene");
}

export async function getAllScenes() {
  if (!OBS_INITIALISED) {
    throw new Error("OBS isn't ready");
  }

  const { scenes } = await request("GetSceneList");

  return scenes;
}

export async function switchToScene(sceneName) {
  return request("SetCurrentScene", {
    "scene-name": sceneName,
  });
}

export async function resetTriggers() {
  return await request("TriggerHotkeyBySequence", {
    keyId: "OBS_KEY_NUM5",
  });
}

export async function showHideSource({ scene, source, isVisible }) {
  return await request("SetSceneItemRender", {
    "scene-name": scene,
    source,
    render: isVisible,
  });
}

export async function showSource({ scene, source }) {
  return await showHideSource({ scene, source, isVisible: true });
}

export async function hideSource({ scene, source }) {
  return await showHideSource({ scene, source, isVisible: false });
}

export async function showHideFilter({
  source,
  filter,
  filterEnabled,
}) {
  return await request("SetSourceFilterVisibility", {
    sourceName: source,
    filterName: filter,
    filterEnabled,
  });
}

export async function toggleFilter({ source, filter }) {
  const result = await request("GetSourceFilterInfo", {
    sourceName: source,
    filterName: filter,
  });

  return await showHideFilter({
    source,
    filter,
    filterEnabled: !result.enabled,
  });
}

export async function handleTriggers({
  triggers,
  itemVisible,
  itemName,
}) {
  try {
    if (!Object.prototype.hasOwnProperty.call(triggers, itemName)) {
      return;
    }

    const triggerFunction = triggers[itemName];

    return await triggerFunction({ isVisible: itemVisible });
  } catch (e) {
    logger.error(e.message);
  }
}

export async function sourceVisibilityTriggers(triggers) {
  obsWebSocket.on(
    "SceneItemVisibilityChanged",
    ({ itemVisible, itemName }) =>
      handleTriggers({ triggers, itemVisible, itemName })
  );
}

export async function filterVisibilityTriggers(sourcesObject) {
  const sources = Object.keys(sourcesObject);
  sources.forEach(async (source) => {
    const triggers = sourcesObject[source];
    const { filters } = await request("GetSourceFilters", {
      sourceName: source,
    });

    if (!filters || filters.length === 0) {
      logger.debug("No filters found");
      return;
    }

    filters.forEach(async (filter) => {
      await handleTriggers({
        triggers,
        itemVisible: filter.enabled,
        itemName: filter.name,
      });
    });

    obsWebSocket.on(
      "SourceFilterVisibilityChanged",
      async ({ filterEnabled, filterName }) => {
        await handleTriggers({
          triggers,
          itemVisible: filterEnabled,
          itemName: filterName,
        });
      }
    );
  });
}

export async function turnOnOverlay(source, timeout) {
  await hideSource({
    scene: "Overlays",
    source,
  });

  setTimeout(() => {
    showSource({
      scene: "Overlays",
      source,
    });

    if (timeout) {
      setTimeout(() => {
        hideSource({
          scene: "Overlays",
          source,
        });
      }, timeout);
    }
  }, 100); // wait 100 ms i guess
}

export async function handleSceneChange(callback) {
  const currentScene = await getCurrentScene();
  callback(currentScene.name);

  // get current scene
  obsWebSocket.on("SwitchScenes", (data) => {
    callback(data["scene-name"]);
  });
}
