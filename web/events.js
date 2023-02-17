import { showError } from "./Messages.svelte";

export let disableEvents = false;

async function httpPostJSON(uri, js) {
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

export function logEvent(name, durMs = 0, meta = {}) {
  if (window.location.host !== "onlinetool.io") {
    return;
  }
  if (durMs > 0) {
    meta.dur = durMs.toFixed(0);
  }
  httpPostJSON(`/event/${name}`, meta);
  // console.log(`ev '${js.type}' took ${js.dur} ms`);
}
