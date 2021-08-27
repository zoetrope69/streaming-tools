const USERS_WHO_HAVE_TALKED = [];

function hasUserTalked(username) {
  return USERS_WHO_HAVE_TALKED.includes(username.toLowerCase());
}

function addToUserWhoHaveTalked(username) {
  USERS_WHO_HAVE_TALKED.push(username.toLowerCase());
}

function firstTimeTalking(username, callback) {
  if (hasUserTalked(username)) {
    return;
  }

  addToUserWhoHaveTalked(username);
  callback();
}

module.exports = {
  firstTimeTalking,
};
