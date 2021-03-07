const getBookTitle = require("./get-book-title");
const createImage = require("./create-image");

async function createGoosebumpsBookImage(keyword) {
  const bookTitle = getBookTitle(keyword);
  await createImage(keyword, bookTitle);
  return { bookTitle };
}

module.exports = createGoosebumpsBookImage;
