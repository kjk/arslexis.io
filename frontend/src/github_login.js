import * as githubapi from "./githubapi.js";

import { get, writable } from "svelte/store";
import { getLocalStorageAsJSON, setLocalStorageFromJSON } from "./util.js";

import { logEvent } from "./events.js";
import popup from "./popup.js";
import { showError } from "./Messages.svelte";

// localStorage key for github token
export const keyGitHubToken = "codeeval:gh-token";
// localStorage key for github user info
const keyGithubUserInfo = "codeeval:gh-user-info";
// localStorage key for login redirect
export const keyTempLoginRedirect = "codeeval:login-redirect";

let onGitHubLogin; // function

export function setOnGitHubLogin(cb) {
  onGitHubLogin = cb;
}

export function setLoginRedirect(v) {
  console.log("setLoginRedirect:", v);
  if (!v) {
    localStorage.removeItem(keyTempLoginRedirect);
    return;
  }
  localStorage.setItem(keyTempLoginRedirect, v);
}

const token = localStorage.getItem(keyGitHubToken);
export const ghtoken = writable(token || null);

const um = getLocalStorageAsJSON(keyGithubUserInfo);
// console.log("store: um:", um);
export const githubUserInfo = writable(um);

export function getLoggedUser() {
  const v = get(githubUserInfo);
  if (!v) {
    return "";
  }
  return v.login;
}

export function getGitHubToken() {
  return get(ghtoken);
}

export function setGitHubToken(v) {
  // console.log("setGitHubToken:", v);
  ghtoken.set(v || null);
}

export function storeGithubUserInfo(v) {
  if (v === null) {
    // we set to empty value first so that other windows get notified
    localStorage.setItem(keyGithubUserInfo, "null");
    localStorage.removeItem(keyGithubUserInfo);
  } else {
    setLocalStorageFromJSON(keyGithubUserInfo, v);
  }
  githubUserInfo.set(v);
}

// only called when value is set from a different window
// we want to know about changes to github token value
// because they indicate the user loggin it, which happens
// in a separate window
async function handleStorageChanged(e) {
  if (e.key !== keyGitHubToken) {
    return;
  }
  const token = e.newValue;
  console.log("token changed to:", token);
  if (!token) {
    // shouldn't happen
    return;
  }
  setToken(token);
}

export async function setToken(token) {
  setGitHubToken(token);
  try {
    const um = await githubapi.getLoggedUserInfo();
    storeGithubUserInfo(um);
    if (onGitHubLogin) {
      onGitHubLogin();
    }
  } catch (ex) {
    console.log("github.getLoggedUserInfo() failed with:", ex);
  }
}

window.addEventListener("storage", handleStorageChanged);

export function openLoginWindow() {
  const uri = window.location.origin + "/auth/ghlogin";
  popup(uri, "GitHub Login", 600, 400);
}

export function logout() {
  // must log before clearing tokens to log user
  logEvent("logout");

  localStorage.removeItem(keyGitHubToken);
  setGitHubToken(null);
  storeGithubUserInfo(null);
}

// call once at startup to check if token is still valid
// if not, initiate login
export async function refreshGitHubTokenIfNeeded() {
  const token = getGitHubToken();
  if (!token) {
    // console.log("refreshGitHubTokenIfNeeded: no token to refresh");
    return;
  }
  // console.log("refreshGitHubTokenIfNeeded: checking token", token);
  const opts = {
    headers: {
      Authorization: "token " + token,
    },
  };

  const uri = `https://api.github.com`;
  try {
    const rsp = await fetch(uri, opts);
    if (rsp.ok) {
      // console.log("refreshGitHubTokenIfNeeded: token ok!");
      setToken(token);
      return;
    }
    if (rsp.status === 401) {
      // console.log(`refreshGitHubTokenIfNeeded: token expired`);
      // remember where we need to redirect
      const loc = window.location.pathname;
      setLoginRedirect(loc);
      //logout();
      // trigger login
      window.location.href = "/auth/ghlogin";
      return;
    }
    console.log(
      `refreshGitHubTokenIfNeeded: failed with ${rsp.status} ${rsp.statusText}`
    );
  } catch (ex) {
    showError(`GET ${uri} failed with '${ex}`);
  }
}
