import { httpPostJSON } from "./httputil";

export let disableEvents = false;

/**
 * @param {Object} o
 */
export function logEventRaw(o) {
  if (disableEvents) {
    return;
  }
  fetch("/event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(o),
  })
    .then((response) => {
      if (!response.ok) {
        console.error("failed to log event:", response.statusText);
      } else {
        console.log("event logged:", o);
      }
    })
    .catch((err) => {
      console.error("failed to log event:", err);
    });
}

export function logEvent(name, durMs = 0, meta = {}) {
  if (durMs > 0) {
    meta.dur = durMs.toFixed(0);
  }
  meta["name"] = name;
  logEventRaw(meta);
}

export function logWcEvent(name, o = {}) {
  logEventRaw({
    app: "wc",
    name: name,
    ...o,
  });
}
