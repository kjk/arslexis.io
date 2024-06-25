import { refreshGitHubTokenIfNeeded } from "../github_login";

export function goGistEditorHome() {
  // console.log("goToHome");
  location.href = "./";
}

// will trigger edit.html / edit.js
export function goToGistById(id) {
  const uri = "./edit?gistid=" + id;
  location.href = uri;
}

/**
 * will trigger edit.html / edit.js
 * @param {string} lang
 */
export function goToCreateNewGist(lang) {
  const uri = "./edit?new=" + encodeURIComponent(lang);
  location.href = uri;
}

// will trigger nogist.html / NoGist.svelte
export function goToNoGist(gistid) {
  const uri = "./nogist?id=" + encodeURIComponent(gistid);
  location.href = uri;
}

refreshGitHubTokenIfNeeded();
