import getBookTitle from "./get-book-title.js";
import createImage from "./create-image.js";

async function createGoosebumpsBookImage(keyword) {
  const bookTitle = getBookTitle(keyword);
  await createImage(keyword, bookTitle);
  return { bookTitle };
}

export default createGoosebumpsBookImage;
