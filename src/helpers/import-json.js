import { fileURLToPath } from "url";
import fs from "fs/promises";

export default async function importJSON(fileUrl) {
  const googleCredentialsFilePath = fileURLToPath(fileUrl);
  return JSON.parse(await fs.readFile(googleCredentialsFilePath));
}
