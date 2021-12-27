import importJSON from "../../helpers/import-json.js";

const { insertionString, titles } = await importJSON(
  new URL("./assets/book-titles.json", import.meta.url)
);

function getRandomBookTitle() {
  return titles[Math.floor(Math.random() * titles.length)];
}

function getBookTitle(keyword) {
  const randomTitle = getRandomBookTitle();
  return randomTitle.replace(insertionString, keyword);
}

export default getBookTitle;
