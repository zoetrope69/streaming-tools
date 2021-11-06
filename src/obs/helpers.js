const obs = require("./index");

function createSourceVisibilityTriggers({ commands, redemptions }) {
  obs.sourceVisibilityTriggers({
    "Joycon: A": async () => {
      return obs.toggleFilter({
        source: "Raw Webcam",
        filter: "Webcam: Recursion Effect",
      });
    },
    "Joycon: B": async () => {
      return obs.toggleFilter({
        source: "Raw Webcam",
        filter: "Webcam: Time Warp Scan",
      });
    },
    "Joycon: Y": async () => {
      return obs.toggleFilter({
        source: "Raw Webcam",
        filter: "Webcam: Trail",
      });
    },
    "Joycon: X": async () => {
      obs.toggleFilter({
        source: "Raw Webcam",
        filter: "Webcam: Fill Colour",
      });
      return obs.toggleFilter({
        source: "Raw Webcam",
        filter: "Webcam: Rainbow",
      });
    },
    "Joycon: R": async () => {},
    "Joycon: RZ": async () => {},
    "Joycon: Right Analog In": async () => {
      const DANCE_SCENES = [
        "Dance",
        "Dance Multiple",
        "Dance everywhere",
        "Dance Mouth",
        "Dance Greggs",
      ];

      const randomDanceScene =
        DANCE_SCENES[Math.floor(Math.random() * DANCE_SCENES.length)];

      await obs.switchToScene(randomDanceScene);
    },
    "Scene change: BRB": async () => {
      await commands.switchToBRBScene();
    },
    "Stop Goosebumps": async () => {
      await redemptions.goosebumps.stop();
    },
  });
}

function createFilterVisibilityTriggers() {
  obs.filterVisibilityTriggers({
    "Main Microphone": {
      "Mic: Deep Voice": async ({ isVisible }) => {
        return await obs.showHideSource({
          scene: "Overlays",
          source: "MIDI: Bass Spin",
          isVisible,
        });
      },
      "Mic: Delay": async ({ isVisible }) => {
        return await obs.showHideSource({
          scene: "Overlays",
          source: "MIDI: Echo",
          isVisible,
        });
      },
      "Mic: Auto-Loop": async ({ isVisible }) => {
        return await obs.showHideSource({
          scene: "Overlays",
          source: "MIDI: Auto-loop",
          isVisible,
        });
      },
    },
  });
}

module.exports = {
  createFilterVisibilityTriggers,
  createSourceVisibilityTriggers,
};
