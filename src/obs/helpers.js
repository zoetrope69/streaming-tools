import obs from "./index.js";

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
      await obs.switchToScene("Dance");
    },
    "Joycon: Right Shoulder": async () => {
      await obs.switchToScene("Dance Multiple");
    },
    "Joycon: Right Trigger": async () => {
      await obs.switchToScene("Dance everywhere");
    },
    "Joycon: Right Analog In": async () => {
      return obs.toggleFilter({
        source: "Raw Webcam",
        filter: "Webcam: Rainbow",
      });
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
    "TONOR Microphone": {
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

export {
  createFilterVisibilityTriggers,
  createSourceVisibilityTriggers,
};
