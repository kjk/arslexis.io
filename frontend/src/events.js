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

export function logGistEvent(name, durMs = 0, o = {}) {
  if (durMs > 0) {
    o.dur = durMs.toFixed(0);
  }
  logEventRaw({
    app: "gist",
    name: name,
    ...o,
  });
}

export function logNpEvent(name, durMs = 0, o = {}) {
  if (durMs > 0) {
    o.dur = durMs.toFixed(0);
  }
  logEventRaw({
    app: "notepad2",
    name: name,
    ...o,
  });
}

export function logWcEvent(name, o = {}) {
  logEventRaw({
    app: "wc",
    name: name,
    ...o,
  });
}

export function logFmEvent(name, o = {}) {
  logEventRaw({
    app: "fm",
    name: name,
    ...o,
  });
}

export function logUnzipEvent(name, o = {}) {
  logEventRaw({
    app: "unzip",
    name: name,
    ...o,
  });
}
