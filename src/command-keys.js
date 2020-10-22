const events = require("events");
const { spawn } = require("child_process");

const KEYS_RELEASEABLE = {
  "<LShift>": "Shift ⇧",
  "<RShift>": "Shift ⇧",
  "<LCtrl>": "Control ⌃",
  "<RCtrl>": "Control ⌃",
  "<LOption>": "Option ⌥",
  "<ROption>": "Option ⌥",
  "<RCommand>": "Command ⌘",
  "<LCommand>": "Command ⌘",
};

const KEYS = {
  "<Enter>": "Enter ↵",
  "<Tab>": "Tab ⇥",
  "<Space>": "Space ␣",
  "<ESC>": "Escape",
};

const CommandKeys = () => {
  /**
   * This requires the janky global-keypress' module's
   * globalkeypress to be piped into stdin
   */
  const cmd = __dirname + "/../bin/globalkeypress";
  const process = spawn(cmd);

  const eventEmitter = new events.EventEmitter();
  let keysHeld = [];

  const addHeldKey = (value) => {
    keysHeld.push(value);
  };

  const removeHeldKey = (value) => {
    keysHeld = keysHeld.filter((key) => key !== value);
  };

  process.stdout.on("data", (data) => {
    const key = data.toString().trim();

    if (key === "") {
      return; // no data
    }

    const regexpSize = /\[released (.+)\]/;
    const match = key.match(regexpSize);

    if (match) {
      const releasedKey = match[1];
      const formattedReleasedKey = KEYS_RELEASEABLE[releasedKey];
      if (formattedReleasedKey) {
        removeHeldKey(formattedReleasedKey);
        eventEmitter.emit("change", { keysHeld });
      }
      return;
    }

    const formattedKey = KEYS_RELEASEABLE[key];
    if (formattedKey) {
      if (keysHeld.includes(formattedKey)) {
        removeHeldKey(formattedKey);
        eventEmitter.emit("change", { keysHeld });
        return;
      }

      eventEmitter.emit("change", { keysHeld, key: formattedKey });
      addHeldKey(formattedKey);

      return;
    }

    if (keysHeld.length > 0) {
      eventEmitter.emit("change", {
        keysHeld,
        key: KEYS[key] || key,
      });
    }
  });

  process.stderr.on("data", (data) => {
    return eventEmitter("error", data.toString());
  });

  process.on("close", (code) => {
    return eventEmitter("close", code);
  });

  return eventEmitter;
};

module.exports = CommandKeys;
