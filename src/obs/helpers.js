import obs from "./index.js";
import createDanceSourceVisibilityTriggers from "./dance-triggers.js";

export function createSourceVisibilityTriggers({
  commands,
  redemptions,
}) {
  createDanceSourceVisibilityTriggers();

  obs.sourceVisibilityTriggers({
    "Scene change: BRB": async () => {
      await commands.switchToBRBScene();
    },
    "Stop Goosebumps": async () => {
      await redemptions.goosebumps.stop();
    },
  });
}

export function createFilterVisibilityTriggers() {
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
