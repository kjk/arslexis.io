import { httpPostJSON } from "./httputil";

export let disableEvents = false;

export function logEvent(name, durMs = 0, meta = {}) {
  if (disableEvents || window.location.host !== "onlinetool.io") {
    return;
  }
  if (durMs > 0) {
    meta.dur = durMs.toFixed(0);
  }
  httpPostJSON(`/event/${name}`, meta);
  // console.log(`ev '${name}' took ${durMs} ms`);
}
