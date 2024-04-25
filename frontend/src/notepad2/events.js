import { httpPostJSON } from "../httputil";

export let disableEvents = false;

export function logNpEvent(name, durMs = 0, meta = {}) {
  if (disableEvents) {
    return;
  }
  if (durMs > 0) {
    meta.dur = durMs.toFixed(0);
  }
  meta["app"] = "notepad2";
  httpPostJSON(`/event/${name}`, meta);
  console.log(`ev '${name}' took ${durMs} ms`);
}
