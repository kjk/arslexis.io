import "./gisteditor.css";

import { downloadGist, getLocalGist, storeLocalGist } from "./store.js";
import { getLangExtFromLangName, getSampleContentForLang } from "./langs.js";

import Editor from "./EditorCodeMirror.svelte";
import { goToNoGist } from "./router.js";
import { len } from "../util.js";
import { mount } from "svelte";

/**
 * @param {string} id
 * @returns {boolean}
 */
function isLocalGistId(id) {
  if (id.startsWith("local-")) {
    return true;
  }
  // legacy behavior, before 2020-12-16: we didn't have "local-" prefix
  return len(id) == 8;
}

/**
 * @param {string} id
 * @returns {boolean}
 */
function isGistId(id) {
  return len(id) == 32;
}

// https://gist.github.com/fiznool/73ee9c7a11d1ff80b81c
// but hugely simplified
/**
 * @returns {string}
 */
function genLocalGistId() {
  const alphabet = "23456789abdegjkmnpqrvwxyz";
  let res = "";
  for (let i = 0; i < 8; i++) {
    res += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return "local-" + res;
}

function newFile(name, v) {
  return {
    filename: name,
    content: v,
  };
}

function newLocalGist(lang = "text", content = "") {
  const ext = getLangExtFromLangName(lang);
  console.log(`lang: ${lang}, ext: ${ext}`);

  let name = "main.txt";
  if (ext !== "") {
    name = "main" + ext;
  }
  // Mabye: check against a unique value like __sample__
  if (content === "") {
    content = getSampleContentForLang(lang);
  }
  const file1 = newFile(name, content);

  const files = {};
  files[file1.filename] = file1;

  return {
    id: genLocalGistId(),
    isLocalGist: true,
    description: "",
    files: files,
  };
}

function startApp(gist) {
  const target = document.getElementById("app");
  const props = {
    gist: gist,
  };
  const args = {
    target: target,
    props: props,
  };
  // TODO: why error? seems to work
  mount(Editor, args);
}

async function createNewGist(lang) {
  console.log("edit: new with lang", lang);
  const gist = newLocalGist(lang, "");
  await storeLocalGist(gist);
  startApp(gist);
}

async function dispatch() {
  const q = new URLSearchParams(window.location.search);
  const lang = q.get("new") || "";
  // TODO: validate lang
  if (lang != "") {
    createNewGist(lang);
    return;
  }

  const gistId = q.get("gistid") || "";
  // console.log("edit: gist id:", gistId);
  if (isLocalGistId(gistId)) {
    const gist = await getLocalGist(gistId);
    if (!gist) {
      goToNoGist(gistId);
      return;
    }
    startApp(gist);
    return;
  }

  if (isGistId(gistId)) {
    const gist = await downloadGist(gistId);
    if (gist === null) {
      goToNoGist(gistId);
      return;
    }
    startApp(gist);
    return;
  }

  goToNoGist(gistId);
}
dispatch();
