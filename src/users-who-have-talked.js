const USERS_WHO_HAVE_TALKED = [];

function hasUserTalked(username) {
  return USERS_WHO_HAVE_TALKED.includes(username.toLowerCase());
}

function addToUserWhoHaveTalked(username) {
  USERS_WHO_HAVE_TALKED.push(username.toLowerCase());
}

export function firstTimeTalking(user, usernameToMatch, callback) {
  if (
    !user?.username ||
    user.username.toLowerCase() !== usernameToMatch.toLowerCase()
  ) {
    return;
  }

  if (hasUserTalked(usernameToMatch)) {
    return;
  }

  addToUserWhoHaveTalked(usernameToMatch);
  callback();
}
