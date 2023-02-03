import { showError } from "./Messages.svelte";

async function httpPost(uri, js) {
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

export function logEvent(js, durMs = null) {
  /*
  if (!js.type) {
    throw new Error(`expected type in event object '${js}'`);
  }
  const user = getLoggedUser();
  if (user) {
    js.user = user;
  }
  if (timeStart) {
    js.dur = durMs;
  }
  httpPost("/event", js)
  */
  // console.log(`ev '${js.type}' took ${js.dur} ms`);
}
