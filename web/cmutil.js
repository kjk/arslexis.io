/* CodeMirror utilities */

import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { java } from "@codemirror/lang-java";
import { vue } from "@codemirror/lang-vue";

// import { angular } from "@codemirror/lang-angular";
//import { wast } from "@codemirror/lang-wast";
import { markdown } from "@codemirror/lang-markdown";
import { xml } from "@codemirror/lang-xml";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { python } from "@codemirror/lang-python";
import { php } from "@codemirror/lang-php";
import { cpp } from "@codemirror/lang-cpp";
import { json } from "@codemirror/lang-json";
// TODO: more https://github.com/codemirror/legacy-modes
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { go } from "@codemirror/legacy-modes/mode/go";
import { diff } from "@codemirror/legacy-modes/mode/diff";
import { StreamLanguage } from "@codemirror/language";

import { getFileExt } from "./util.js";

/** @typedef { import("@codemirror/language").LanguageSupport} LanguageSupport */

/**
 * @param {string} fileName
 * @returns {LanguageSupport|StreamLanguage}
 */
export function getLangFromFileName(fileName) {
  const ext = getFileExt(fileName).toLowerCase();
  if (ext === "") {
    return null;
  }
  switch (ext) {
    case ".js":
    case ".ts":
      return javascript();
    case ".json":
      return json();
    case ".css":
      return css();
    case ".html":
      return html();
    case ".java":
      return java();
    case ".vue":
      return vue();
    case ".md":
    case ".markdown":
      return markdown();
    case ".xml":
      return xml();
    case ".rs":
      return rust();
    case ".sql":
      return sql();
    case ".py":
      return python();
    case ".c":
    case ".cpp":
    case ".c++":
    case ".cxx":
    case ".h":
    case ".hpp":
    case ".hxx":
      return cpp();
    case ".php":
      return php();
    case ".lua":
      return StreamLanguage.define(lua);
    case ".go":
      return StreamLanguage.define(go);
    case ".diff":
      return StreamLanguage.define(diff);
  }
  return null;
}

/**
 * try real hard to put focus in EditorView
 * @param {import("@codemirror/view").EditorView} editorView
 */
export function focusEditorView(editorView) {
  if (!editorView) {
    return;
  }
  let max = 10; // limit to 1 sec
  const timer = setInterval(() => {
    editorView.focus();
    max -= 1;
    if (editorView.hasFocus || max < 0) clearInterval(timer);
  }, 100);
}
