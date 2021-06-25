export default function truncate(text, amount = 100) {
  if (!text || text.length === 0) {
    return "";
  }

  if (text.length < amount) {
    return text;
  }

  return text.substring(0, amount) + "...";
}
