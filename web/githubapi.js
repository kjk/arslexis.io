import { showMessage, clearMessage, showError } from "./Messages.svelte";

import { getGitHubToken } from "./github_login";
import { startTimer } from "./util.js";
import { logEvent } from "./events.js";

export function addHeader(opts, key, val) {
  opts.headers = opts.headers || {};
  opts.headers[key] = val;
}

export function addToken(opts) {
  const token = getGitHubToken();
  if (token) {
    addHeader(opts, "Authorization", "token " + token);
  }
  return opts;
}

export function checkResponse(rsp, method, uri) {
  if (rsp.ok) {
    return true;
  }
  showError(`${method} ${uri} failed with ${rsp.status}`);
  return false;
}

export async function apiGet(endpoint) {
  const uri = `https://api.github.com${endpoint}`;
  try {
    const opts = addToken({});
    // TODO: breaks CORS
    // addHeader(opts, "X-GitHub-Api-Version", "2022-11-28");
    addHeader(opts, "Accept", "application/vnd.github+json");

    const rsp = await fetch(uri, opts);
    if (!checkResponse(rsp, "GET", uri)) {
      return null;
    }
    const js = await rsp.json();
    // console.log("github.apiGet(", endpoint, ") js:", js);
    clearMessage();
    return js;
  } catch (ex) {
    showError(`GET ${uri} failed with '${ex}`);
  }
  return null;
}

// <https://api.github.com/gists?per_page=100&page=2>; rel="next", <https://api.github.com/gists?per_page=100&page=4>; rel="last"
export function getLinkNext(link) {
  link = link || "";
  let m = link.match(/<([^>]+)>;\s*rel="next"/);
  return (m || [])[1];
}

export async function apiGetPaginateAll(endpoint) {
  const res = [];
  let uri = `https://api.github.com${endpoint}`;
  try {
    const opts = addToken({});
    while (uri) {
      const rsp = await fetch(uri, opts);
      if (!checkResponse(rsp, "GET", uri)) {
        return null;
      }
      const js = await rsp.json();
      for (let el of js) {
        res.push(el);
      }
      uri = "";
      const link = rsp.headers.get("Link");
      if (link) {
        uri = getLinkNext(link);
      }
    }
    // console.log("github.apiGet(", endpoint, ") js:", js);
    clearMessage();
    return res;
  } catch (ex) {
    showError(`GET ${uri} failed with '${ex}`);
  }
  return null;
}

/**
 * @param {string} endpoint
 * @returns {Promise<boolean>}
 */
export async function apiDelete(endpoint) {
  const uri = `https://api.github.com${endpoint}`;
  try {
    let opts = {
      method: "DELETE",
    };
    opts = addToken(opts);
    const rsp = await fetch(uri, opts);
    if (!checkResponse(rsp, "DELETE", uri)) {
      return false;
    }
    // console.log("github.apiDelete(", endpoint, ")");
    clearMessage();
  } catch (ex) {
    showError(`DELETE ${uri} failed with '${ex}`);
    return false;
  }
  return true;
}

/**
 * @param {string} endpoint
 * @param {*} data
 */
export async function apiPatch(endpoint, data) {
  const uri = `https://api.github.com${endpoint}`;
  try {
    let opts = {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    };
    opts = addToken(opts);
    const rsp = await fetch(uri, opts);
    if (!checkResponse(rsp, "PATCH", uri)) {
      return null;
    }
    const js = await rsp.json();
    // console.log("github.apiPatch(", endpoint, ") js:", js);
    clearMessage();
    return js;
  } catch (ex) {
    showError(`PATCH api.github.com${endpoint} failed with '${ex}`);
  }
  return null;
}

/**
 * @param {string} endpoint
 * @param {*} data
 */
export async function apiPost(endpoint, data) {
  const uri = `https://api.github.com${endpoint}`;
  try {
    let opts = {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    };
    opts = addToken(opts);
    const rsp = await fetch(uri, opts);
    if (!checkResponse(rsp, "POST", uri)) {
      return null;
    }
    const js = await rsp.json();
    // console.log("github.apiPost(", endpoint, ") js:", js);
    clearMessage();
    return js;
  } catch (ex) {
    showError(`POST api.github.com${endpoint} failed with '${ex}`);
  }
  return null;
}

export function checkForError(rsp) {
  if (!rsp) {
    return rsp;
  }
  if (rsp.errors) {
    const msg = rsp.message;
    showError(msg);
    return null;
  }
  return rsp;
}

/*
// https://developer.github.com/v3/gists/#list-a-users-gists
export async function getGistsForUser(userID) {
  showMessage(`getting list of gists for user ${userID}`, 10000);
  const elapsedFn = startTimer();
  const uri = `/users/${userID}/gists?per_page=100`;
  const gists = await apiGetPaginateAll(uri);
  const ev = {
    user: userID,
  };
  logEvent("getGistsForUser", elapsedFn(), ev)
  console.log(`getGistsForUser: '${userID} ${len(gists)} in ${elapsedFn()} ms`);
  return checkForError(gists);
}
*/

// https://developer.github.com/v3/users/#get-the-authenticated-user
export async function getLoggedUserInfo() {
  showMessage(`getting github user info`, 10000);
  const um = await apiGet("/user");
  return checkForError(um);
}

/**
 * https://developer.github.com/v3/gists/#edit-a-gist
 * @param {string} gistId
 * @param {Object} data
 */
export async function updateGist(gistId, data) {
  const elapsedFn = startTimer();
  showMessage(`saving the gist`, 10000);
  const uri = `/gists/${gistId}`;
  const gist = await apiPatch(uri, data);
  const meta = {
    gistId: gistId,
  };
  logEvent("updateGist", elapsedFn(), meta);
  return checkForError(gist);
}

/**
 * https://developer.github.com/v3/gists/#create-a-gist
 * @param {Object} gist
 */
export async function createGist(gist) {
  const elapsedFn = startTimer();
  console.log("createGist:", gist);
  showMessage(`creating a new gist`, 10000);
  const res = await apiPost(`/gists`, gist);
  logEvent("createGist", elapsedFn());
  return checkForError(res);
}

/**
 * https://developer.github.com/v3/gists/#delete-a-gist
 * @param {string} gistId
 * @returns {Promise<boolean>}
 */
export async function deleteGist(gistId) {
  console.log(`deleteGist ${gistId}`);

  showMessage("deleting the gist", 10000);
  const elapsedFn = startTimer();
  const ok = await apiDelete(`/gists/${gistId}`);
  const meta = {
    gistId: gistId,
  };
  logEvent("deleteGist", elapsedFn(), meta);
  return ok;
}
