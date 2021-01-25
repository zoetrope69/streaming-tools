const fs = require("fs");

async function controlLols({
  twitchApi,
  user,
  isMod,
  isBroadcaster,
  twitchChatMessage,
}) {
  let usernameToFight = user.username;

  if (isMod || isBroadcaster) {
    let fightMeUsername = twitchChatMessage.split(" ")[1];

    if (fightMeUsername) {
      if (fightMeUsername.startsWith("@")) {
        fightMeUsername = fightMeUsername.substring(1);
      }

      if (fightMeUsername && fightMeUsername.length > 0) {
        usernameToFight = fightMeUsername;
      }
    }
  }

  const userToFight = await twitchApi.getUser(usernameToFight);

  if (!userToFight) {
    return;
  }

  const path =
    "/mnt/c/Program Files/Epic Games/Control/ui/hud/DynaHUD.js";
  fs.readFile(path, "utf-8", function (err, data) {
    if (err) {
      return console.error(err);
    }

    const startString = "const ENEMY_IMAGE = '";
    const endString = "'; // end of ENEMY_IMAGE";

    const imageString = data
      .split(startString)[1]
      .split(endString)[0];

    const result = data.replace(imageString, userToFight.image);

    fs.writeFile(path, result, "utf8", function (err) {
      if (err) return console.error(err);
    });
  });
}

module.exports = controlLols;
