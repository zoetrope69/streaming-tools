function bufferFromBase64(base64text) {
  let contentType = "";
  if (base64text.includes("image/png")) {
    contentType = "png";
  } else if (base64text.includes("image/jpeg")) {
    contentType = "jpeg";
  } else if (base64text.includes("image/jpg")) {
    contentType = "jpg";
  }

  const base64data = base64text.replace(
    `data:image/${contentType};base64`,
    ""
  ); // strip image type prefix

  return {
    buffer: Buffer.from(base64data, "base64"),
    contentType,
  };
}

export default bufferFromBase64;
