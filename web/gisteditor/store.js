import { writable } from "svelte/store";
import { len, startTimer } from "../util.js";
import { clearMessage, showError, showMessage } from "../Messages.svelte";
import { setOnGitHubLogin } from "../github_login.js";
import {
  addHeader,
  addToken,
  checkForError,
  checkResponse,
  getLinkNext,
} from "../githubapi.js";
import { logEvent } from "../events.js";
// @ts-ignore
import Dexie from "https://esm.sh/dexie@3.2.3";

// localStorage key for gists
export const cacheKeyGistsForLoggedUser = "gists_for_logged_user";
// localStorage key for the time of last refresh of gists
export const cacheKeyLastGistsRefreshTime = "gists_refresh_time";

// https://dexie.org/docs/Tutorial/Getting-started
// @ts-ignore
export const db = new Dexie("cloudeval");
const schema1 = {
  gistsSummary: "id,created_at,updated_at",
  localGists: "id,created_at,updated_at",
};
const schema2 = {
  // cache for data that is expensive to get e.g. gists
  // cache_key uniquey identifies an object
  // we use prefixes to uniqely identify different kinds
  // of objects e.g. "gist:${gistID}" is a cache key for gists
  // lack of key marks this as inbound key i.e. provided separately
  // that way we don't pollute the object with the key
  cache: "",
  fullGists: null,
};
db.version(1).stores(schema1);
db.version(2).stores(schema2);

/**
 * @param {string} gistId
 * @returns {string}
 */
export function cacheKeyGist(gistId) {
  return `gist:${gistId}`;
}

/**
 * @param {string} key
 */
export async function dbGetCache(key) {
  const res = await db.cache.get(key);
  return res;
}

/**
 * @param {string} key
 * @param {*} v
 */
export async function dbSetCache(key, v) {
  // .put() returns a key, which should be the same as provided
  await db.cache.put(v, key);
}

export async function deleteGistsForLoggedUser() {
  await db.cache.delete(cacheKeyGistsForLoggedUser);
}

export const gistsSummary = writable([]);

/*
async function updateGistsSummaryFromDB() {
  const elapsedFn = startTimer;
  const key = cacheKeyGistsForLoggedUser;
  const res = await dbGetCache(key);
  //const res = await db.gistsSummary.toCollection().reverse().sortBy("created_at");
  let n = 0;
  if (res) {
    const gists = res.elements;
    n = len(gists);
    gistsSummary.set(gists);
  }
  console.log(`updateGistsSummaryFromDB ${n} in ${elapsedFn()} ms`);
}
*/

export const localGists = writable([]);

async function updateLocalGistsFromDB() {
  const elapsedFn = startTimer();
  const res = await db.localGists.reverse().sortBy("created_at");
  localGists.set(res);
  console.log(`updateLocalGistsFromDB ${len(res)} in ${elapsedFn()} ms`);
}

// to avoid flash when we have both local and remote, this
// updates them at the same time;
async function updateBothGistsInfoFromDB() {
  // const elapsedFn = startTimer();
  const local = await db.localGists.reverse().sortBy("created_at");
  const key = cacheKeyGistsForLoggedUser;
  // TODO: why does it take 500 ms to read an object with 400 entries?
  const cachedGists = await dbGetCache(key);
  //const res = await db.gistsSummary.toCollection().reverse().sortBy("created_at");
  let n = 0;
  if (cachedGists) {
    n += len(cachedGists.elements);
    gistsSummary.set(cachedGists.elements);
  }
  if (local) {
    n += len(local);
    localGists.set(local);
  }
  // console.log(`updateBothGistsInfoFromDB ${n} in ${elapsedFn()} ms`);
}

// at startup we load all info from localStorage into a store

// console.log("store: gh:", token);

updateBothGistsInfoFromDB();

// 2010-04-14T02:15:15Z as per https://developer.github.com/v3/gists/#parameters-2
export function genGistCurrentDate() {
  let dt = new Date().toISOString();
  const idx = dt.lastIndexOf(".");
  if (idx > 0) {
    dt = dt.substring(0, idx) + "Z";
  }
  return dt;
}

export async function storeLocalGist(gist) {
  console.log("storeLocalGist:", gist);
  const dt = genGistCurrentDate();
  if (!gist.created_at) {
    gist.created_at = dt;
  }
  gist.updated_at = dt;
  const res = await db.localGists.put(gist);
  console.log("storeLocalGist: res:", res);
  await updateLocalGistsFromDB();
  return res;
}

export async function getLocalGist(id) {
  const gist = await db.localGists.get(id);
  console.log("getLocalGist:", gist);
  return gist;
}

export async function deleteLocalGist(id) {
  console.log("deleteLocalGist:", id);
  await db.localGists.delete(id);
  await updateLocalGistsFromDB();
}

// https://developer.github.com/v3/gists/#list-a-users-gists
const gistKeysToDelete = [
  "url",
  "forks_url",
  "commits_url",
  "git_pull_url",
  "git_push_url",
  "html_url",
  "comments_url",
];
const ownerKeysToDelete = [
  "url",
  "html_url",
  "followers_url",
  "following_url",
  "gists_url",
  "starred_url",
  "subscriptions_url",
  "organizations_url",
  "repos_url",
  "events_url",
  "received_events_url",
];

/**
 * Deletes un-needed data from user object
 * @param {Object} user
 */
function minimizeUser(user) {
  let nDeleted = 0;
  for (let k of ownerKeysToDelete) {
    if (user[k] !== undefined) {
      nDeleted++;
      delete user[k];
    }
  }
  return nDeleted;
}

/**
 * Delete un-needed data from gist objects
 * @param {?Object[]} gists
 */
function minimizeGists(gists) {
  let nDeleted = 0;
  gists = gists || [];
  for (let gist of gists) {
    for (let k of gistKeysToDelete) {
      if (gist[k] !== undefined) {
        delete gist[k];
        nDeleted++;
      }
    }
    nDeleted += minimizeUser(gist["owner"]);
  }
  console.log(
    `minimizeGists: deleted ${nDeleted} fields for ${len(gists)} gists`
  );
}

// https://developer.github.com/v3/gists/#list-a-users-gists
export async function getGistsForLoggedUser() {
  const elapsedFn = startTimer();
  showMessage(`getting list of your gists`, 10000);
  //const gists = await apiGetPaginateAll("/gists?per_page=100");

  // with ~380 gists, caching is ~4x faster (1s vs 4s)
  const cacheKey = cacheKeyGistsForLoggedUser;
  function transformBeforeStore(gists) {
    minimizeGists(gists);
    return gists;
  }
  const v = await apiGetPaginateAllCached(
    "/gists?per_page=100",
    cacheKey,
    transformBeforeStore
  );
  const gists = v.result;
  const meta = {
    fromCache: v.fromCache,
  };
  logEvent("getGistsForLoggedUser", elapsedFn(), meta);
  console.log(`getGistsForLoggedUser: ${len(gists)} in ${elapsedFn()} ms`);
  return v;
}

function isGistTruncated(gist) {
  if (!gist || !gist.files) {
    return false;
  }
  for (let name in gist.files) {
    const f = gist.files[name];
    if (f.truncated) {
      return true;
    }
  }
  return false;
}

// if gist.files[file].truncated is true, downloads content
// from gist.files[file].raw_url and  updates gist.files[file].content
// in-place
// TODO: files greater than 10 MB need to be git cloned
async function downloadTruncatedFiles(gist) {
  if (!gist || !gist.files) {
    return false;
  }
  for (let name in gist.files) {
    const f = gist.files[name];
    if (!f.truncated) {
      continue;
    }
    let uri = f.raw_url;
    try {
      let opts = {};
      // TODO: breaks CORS
      // opts = addToken(opts);
      // TODO: breaks CORS
      // known bug: https://github.com/community/community/discussions/40619
      // addHeader(opts, "X-GitHub-Api-Version", "2022-11-28");
      // addHeader(opts, "Accept", "application/vnd.github.raw");
      const rsp = await fetch(uri, opts);
      if (!checkResponse(rsp, "GET", uri)) {
        return null;
      }
      const txt = await rsp.text();
      f.content = txt;
      f.truncated = false;
    } catch (ex) {
      showError(`GET ${uri} failed with '${ex}`);
      return null;
    }
  }
  return gist;
}

export async function apiGetCached(endpoint, cacheKey) {
  const v = await dbGetCache(cacheKey);
  let etag = null;
  if (v && v.etag) {
    // TODO: apiGetCached() is generic so it could return other
    // stuff, not just gist. but today it's only gists
    // some files could have been cached truncated so
    // this "uncaches" such files
    if (!isGistTruncated(v)) {
      etag = v.etag;
    }
    // console.log(`got cached value for key ${cacheKey} with etag ${etag}`);
  }

  const uri = `https://api.github.com${endpoint}`;
  try {
    let opts = addToken({});
    // TODO: breaks CORS
    // addHeader(opts, "X-GitHub-Api-Version", "2022-11-28");
    addHeader(opts, "Accept", "application/vnd.github+json");
    if (etag) {
      addHeader(opts, "If-None-Match", etag);
    }
    const rsp = await fetch(uri, opts);
    // got a cached response
    if (rsp.status === 304) {
      // TODO: maybe make a deep copy and strip etag?
      delete v.etag;
      clearMessage();
      return v;
    }
    if (!checkResponse(rsp, "GET", uri)) {
      return null;
    }
    let js = await rsp.json();
    // TODO: apiGetCached() is generic so it could return other
    // stuff, not just gist. but today it's only gists
    js = await downloadTruncatedFiles(js);
    if (js === null) {
      return null;
    }
    etag = rsp.headers.get("ETag");
    if (etag) {
      // console.log(`got etag ${etag}, caching in db`);
      js.etag = etag;
      // we await to catch errors
      await dbSetCache(cacheKey, js);
      delete js.etag;
    }
    // console.log("github.apiGet(", endpoint, ") js:", js);
    clearMessage();
    return js;
  } catch (ex) {
    // TODO: return cached value, if exists? This would
    // handle offline usage better, although we would still
    // need something for storing
    showError(`GET ${uri} failed with '${ex}`);
  }
  return null;
}

export async function apiGetPaginateAllCached(
  endpoint,
  cacheKey,
  transformBeforeStore
) {
  const v = await dbGetCache(cacheKey);
  let etag = null;
  if (v && v.etag) {
    etag = v.etag;
    // console.log(`got cached value for key ${cacheKey} with etag ${etag}`);
  }

  let res = [];
  let uri = `https://api.github.com${endpoint}`;
  try {
    const opts = addToken({});
    if (etag) {
      addHeader(opts, "If-None-Match", etag);
    }
    let firstPage = true;
    while (uri) {
      const rsp = await fetch(uri, opts);
      // got a cached response
      if (rsp.status === 304) {
        // TODO: maybe make a deep copy and strip etag?
        delete v.etag;
        // console.log(`apiGetPaginateAllCached: got cached response for ${uri}, key: ${cacheKey}`);
        clearMessage();
        return {
          result: v.elements,
          fromCache: true,
        };
      }
      if (!checkResponse(rsp, "GET", uri)) {
        return null;
      }
      // hopefully this is the right semantics: remember etag from
      // the first response
      if (firstPage) {
        etag = rsp.headers.get("Etag");
        firstPage = false;
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
    if (etag && len(res) > 0) {
      if (transformBeforeStore) {
        res = transformBeforeStore(res);
      }
      const v = {
        elements: res,
        etag: etag,
      };
      // we await to catch errors
      await dbSetCache(cacheKey, v);
    }
    clearMessage();

    return {
      result: res,
      fromCache: false,
    };
  } catch (ex) {
    showError(`GET ${uri} failed with '${ex}`);
  }
  return null;
}

/**
 * https://docs.github.com/en/rest/gists/gists?apiVersion=2022-11-28#get-a-gist
 * @param {string} gistId
 */
export async function downloadGist(gistId) {
  const elapsedFn = startTimer();
  showMessage(`downloading the gist`, 10000);

  const uri = `/gists/${gistId}`;
  const cacheKey = cacheKeyGist(gistId);
  const gist = await apiGetCached(uri, cacheKey);
  const meta = {
    gistId: gistId,
  };
  logEvent("downloadGist", elapsedFn(), meta);
  return checkForError(gist);
}

/**
 * @returns {boolean}
 */
function shouldRefreshGists() {
  const lastRefreshStr = localStorage.getItem(cacheKeyLastGistsRefreshTime);
  if (!lastRefreshStr) {
    return true;
  }
  const lastRefresh = Date.parse(lastRefreshStr);
  const tdiffMs = Date.now() - lastRefresh;
  const expiryMs = 1000 * 60 * 60 * 2; // 2 hrs in ms
  return tdiffMs > expiryMs;
}

/**
 * @param {boolean} force
 */
export async function refreshGistsForLoggedUser(force) {
  const shouldRefresh = shouldRefreshGists();
  if (!shouldRefresh && !force) {
    // console.log("refreshGistsForLoggedUser: skipping because not expired");
    return;
  }
  try {
    const res = await getGistsForLoggedUser();
    if (res === null) {
      // on error don't clear existing data
      return;
    }
    // console.log(`refreshGistsForLoggedUser: fromCache=${res.fromCache}`);
    const gists = res.result;
    gistsSummary.set(gists);
    localStorage.setItem(cacheKeyLastGistsRefreshTime, Date.now().toString());
  } catch (ex) {
    showError(`githubapi.getGistsForLoggedUser() failed with: ${ex}`);
    return;
  }
}
