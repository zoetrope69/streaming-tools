import fetch from "node-fetch";
const { AbortError } = fetch;

async function fetchWithTimeout(url, options, timeoutDelayMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutDelayMs);

  try {
    return fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof AbortError) {
      throw new Error("Fetch timedout");
    }
  } finally {
    clearTimeout(timeout);
  }
}

export default fetchWithTimeout;
