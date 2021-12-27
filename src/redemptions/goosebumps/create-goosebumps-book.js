import getBookTitle from "./get-book-title.js";
import createImage from "./create-image.js";

async function createGoosebumpsBook(keyword) {
  const bookTitle = getBookTitle(keyword);
  await createImage(keyword, bookTitle);
  return { bookTitle };
}

export default createGoosebumpsBook;
