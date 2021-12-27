import obs from "./obs/index.js";
import { setTimeout } from "timers/promises"; // eslint-disable-line node/no-missing-import

const DANCE_TRANSITION_DURATION_MS = 600;
const BASE_DANCE_STRING = "Dance";
const DANCE_SCENES = {};

function parseDanceSceneName(name) {
  const [baseString, type, positionString] = name
    .split("|")
    .map((n) => n.trim());

  if (!baseString.includes(BASE_DANCE_STRING)) {
    // not in a dance scene ignore
    return null;
  }

  const position = parseInt(positionString, 10);

  return {
    type,
    position,
  };
}

async function getCurrentDanceScene() {
  const { name } = await obs.getCurrentScene();
  const parsedDanceSceneName = parseDanceSceneName(name);

  if (!parsedDanceSceneName) {
    // not in a dance scene ignore
    return null;
  }

  return parsedDanceSceneName;
}

async function changeDanceScene({ forward = true }) {
  const currentDanceScene = await getCurrentDanceScene();
  if (!currentDanceScene) {
    // not in a dance scene ignore
    return;
  }

  const { type, position } = currentDanceScene;

  const { positionAmount } = DANCE_SCENES[type];

  if (forward ? position === positionAmount : position === 1) {
    // if we're at first/last position dont do anything
    return;
  }

  const newPosition = forward ? position + 1 : position - 1;

  await obs.switchToScene(
    `${BASE_DANCE_STRING} | ${type} | ${newPosition}`
  );
}

async function findDanceScenes() {
  const scenes = await obs.getAllScenes();
  const sceneNames = scenes.map((scene) => scene.name);
  const danceSceneNames = sceneNames.filter((sceneName) => {
    return sceneName.startsWith(BASE_DANCE_STRING);
  });

  danceSceneNames.forEach((danceSceneName) => {
    const { type } = parseDanceSceneName(danceSceneName);
    const existingDanceScene = DANCE_SCENES[type];

    // if there's not existing dance scene stored add it
    if (!existingDanceScene) {
      DANCE_SCENES[type] = {
        positionAmount: 1,
      };
      return;
    }

    // add to the position amount
    existingDanceScene.positionAmount += 1;
  });
}

async function changeToRandomDanceScene() {
  const currentDanceScene = await getCurrentDanceScene();

  /*
        if we're on a dance scene already but not the 1st
        we need to move back to the first to transition to the new one
      */
  if (currentDanceScene?.position > 1) {
    await obs.switchToScene(
      `${BASE_DANCE_STRING} | ${currentDanceScene.type} | 1`
    );
    await setTimeout(DANCE_TRANSITION_DURATION_MS);
  }

  const allDanceSceneTypes = Object.keys(DANCE_SCENES);

  // remove the current dance scene from selection
  const danceSceneTypes = allDanceSceneTypes.filter(
    (danceSceneType) => {
      return danceSceneType !== currentDanceScene?.type;
    }
  );

  const randomDanceSceneType =
    danceSceneTypes[
      Math.floor(Math.random() * danceSceneTypes.length)
    ];

  await obs.switchToScene(
    `${BASE_DANCE_STRING} | ${randomDanceSceneType} | 1`
  );
}

async function handleDanceTriggers({ joycons }) {
  await findDanceScenes();

  joycons.on("rightPress", async (event) => {
    if (event === "A") {
      await obs.toggleFilter({
        source: "Raw Webcam",
        filter: "Webcam: Recursion Effect",
      });
      return;
    }

    if (event === "B") {
      await obs.toggleFilter({
        source: "Raw Webcam",
        filter: "Webcam: Time Warp Scan",
      });
      return;
    }

    if (event === "Y") {
      await obs.toggleFilter({
        source: "Raw Webcam",
        filter: "Webcam: Trail",
      });
      return;
    }

    if (event === "X") {
      obs.toggleFilter({
        source: "Raw Webcam",
        filter: "Webcam: Fill Colour",
      });
      await obs.toggleFilter({
        source: "Raw Webcam",
        filter: "Webcam: Rainbow",
      });
      return;
    }

    if (event === "R") {
      await changeDanceScene({ forward: false });
      return;
    }

    if (event === "ZR") {
      await changeDanceScene({ forward: true });
      return;
    }

    if (event === "joystick-in") {
      await changeToRandomDanceScene();
      return;
    }
  });
}

export default handleDanceTriggers;
