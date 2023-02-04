/* CodeMirror utilities */

import { basicSetup } from "codemirror";
import {
  EditorView,
  keymap,
  placeholder as placeholderExt,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
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

/** @typedef { import("@codemirror/state").Extension} Extension */
/**
 * @param {boolean} basic
 * @param {boolean} useTab
 * @param {number} tabSize
 * @param {boolean} lineWrapping
 * @param {string} placeholder
 * @param {boolean} editable
 * @param {boolean} readonly
 * @returns {Extension[]}
 */
export function getBaseExtensions(
  basic,
  useTab,
  tabSize,
  lineWrapping,
  placeholder,
  editable,
  readonly
) {
  /** @type {Extension[]} */
  const res = [
    indentUnit.of(" ".repeat(tabSize)),
    EditorView.editable.of(editable),
    EditorState.readOnly.of(readonly),
  ];

  if (basic) res.push(basicSetup);
  if (useTab) res.push(keymap.of([indentWithTab]));
  if (placeholder) res.push(placeholderExt(placeholder));
  if (lineWrapping) res.push(EditorView.lineWrapping);

  return res;
}

/**
 * @param {*} theme
 * @param {*} styles
 * @returns {Extension[]}
 */
export function getTheme(theme, styles) {
  /** @type {Extension[]} */
  const extensions = [];
  if (styles) extensions.push(EditorView.theme(styles));
  if (theme) extensions.push(theme);
  return extensions;
}

/**
 * try real hard to put focus in EditorView
 * @param {EditorView} editorView
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
