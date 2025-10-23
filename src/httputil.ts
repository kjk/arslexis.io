import { showError } from "./Messages.svelte";

export async function httpPostJSON(uri, js) {
  try {
    let opts = {
      method: "POST",
      body: JSON.stringify(js),
      headers: {
        "Content-Type": "application/json",
      },
    };
    await fetch(uri, opts);
  } catch (ex) {
    showError(`POST ${uri} failed with '${ex}`);
  }
}
