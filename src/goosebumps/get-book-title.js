import bookTitlesFile from "./assets/book-titles.json";
const { insertionString, titles } = bookTitlesFile;

function getRandomBookTitle() {
  return titles[Math.floor(Math.random() * titles.length)];
}

function getBookTitle(keyword) {
  const randomTitle = getRandomBookTitle();
  return randomTitle.replace(insertionString, keyword);
}

export default getBookTitle;
