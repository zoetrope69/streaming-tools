const {
  insertionString,
  titles,
} = require("./assets/book-titles.json");

function getRandomBookTitle() {
  return titles[Math.floor(Math.random() * titles.length)];
}

function getBookTitle(keyword) {
  const randomTitle = getRandomBookTitle();
  return randomTitle.replace(insertionString, keyword);
}

module.exports = getBookTitle;
