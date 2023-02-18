// https://codemirror.net/5/mode/index.html
// https://github.com/codemirror/legacy-modes/blob/main/mode/README.md
// https://gist.github.com/rooks/6a13affb544ef8bc338b49af7d018318 csv mode
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

// legacy modes
import { StreamLanguage } from "@codemirror/language";
import { sCSS, less } from "@codemirror/legacy-modes/mode/css";
import { octave } from "@codemirror/legacy-modes/mode/octave";
import { shell } from "@codemirror/legacy-modes/mode/shell";

import { getFileExt, len } from "./util.js";

/** @typedef { import("@codemirror/language").LanguageSupport} LanguageSupport */

import {
  IDM_LEXER_CSS,
  IDM_LEXER_XML,
  IDM_LEXER_SCSS,
  IDM_LEXER_LESS,
  IDM_LEXER_PHP,
  IDM_LEXER_MARKDOWN_GITHUB,
  IDM_LEXER_MARKDOWN_GITLAB,
  IDM_LEXER_MARKDOWN_PANDOC,
  IDM_LEXER_HSS,
  IDM_LEXER_WEB,
  IDM_LEXER_JSP,
  IDM_LEXER_ASPX_CS,
  IDM_LEXER_ASPX_VB,
  IDM_LEXER_ASP_VBS,
  IDM_LEXER_ASP_JS,
  IDM_LEXER_OCTAVE,
  IDM_LEXER_BASH,
  IDM_LEXER_MATLAB,
  IDM_LEXER_SCILAB,
  IDM_LEXER_M4,
  IDM_LEXER_XSD,
  IDM_LEXER_XSLT,
  IDM_LEXER_DTD,
  IDM_LEXER_ANT_BUILD,
  IDM_LEXER_CSHELL,
  IDM_LEXER_MAVEN_POM,
  IDM_LEXER_MAVEN_SETTINGS,
  IDM_LEXER_IVY_MODULE,
  IDM_LEXER_IVY_SETTINGS,
  IDM_LEXER_PMD_RULESET,
  IDM_LEXER_CHECKSTYLE,
  IDM_LEXER_APACHE,
  IDM_LEXER_TOMCAT,
  IDM_LEXER_WEB_JAVA,
  IDM_LEXER_STRUTS,
  IDM_LEXER_HIB_CFG,
  IDM_LEXER_HIB_MAP,
  IDM_LEXER_SPRING_BEANS,
  IDM_LEXER_JBOSS,
  IDM_LEXER_PROPERTY_LIST,
  IDM_LEXER_ANDROID_MANIFEST,
  IDM_LEXER_ANDROID_LAYOUT,
  IDM_LEXER_CSV,
} from "./notepad2/menu-notepad2";

// see Style_UpdateLexerLang in Styles.c

const langs = [
  [javascript(), "IDM_LEXER_JS", ".js", ".ts", ".jsx", ".tsx"],
  [json(), "IDM_LEXER_JSON", ".json"],
  [css(), IDM_LEXER_CSS, ".css"],
  [html(), IDM_LEXER_WEB, ".html"],
  // [html(), "IDM_LEXER_HTML", ".html"],
  [java(), "IDM_LEXER_JAVA", ".java"],
  [vue(), "IDM_LEXER_VUE", ".vue"],
  [markdown(), "IDM_LEXER_MARKDOWN", ".md", ".markdown"],
  [markdown(), IDM_LEXER_MARKDOWN_GITHUB, ".md", ".markdown"],
  [markdown(), IDM_LEXER_MARKDOWN_GITLAB, ".md", ".markdown"],
  [markdown(), IDM_LEXER_MARKDOWN_PANDOC, ".md", ".markdown"],
  [xml(), IDM_LEXER_XML, ".xml", ".svg"],
  [rust(), "IDM_LEXER_RUST", ".rs"],
  [sql(), "IDM_LEXER_SQL", ".sql"],
  [python(), "IDM_LEXER_PYTHON", ".py"],
  [cpp(), "IDM_LEXER_CPP", ".c", ".cpp", ".c++", ".cxx", ".h", ".hpp", ".hxx"],
  [php(), IDM_LEXER_PHP, ".php"],
  [StreamLanguage.define(lua), "IDM_LEXER_LUA", ".lua"],
  [StreamLanguage.define(go), "IDM_LEXER_GO", ".go"],
  [StreamLanguage.define(diff), "IDM_LEXER_DIFF", ".diff"],

  [StreamLanguage.define(sCSS), IDM_LEXER_SCSS, ".scss"],
  [StreamLanguage.define(less), IDM_LEXER_LESS, ".scss"],
  [StreamLanguage.define(octave), IDM_LEXER_OCTAVE, ".octave"],
  [StreamLanguage.define(octave), IDM_LEXER_MATLAB, ".m"],
  [StreamLanguage.define(octave), IDM_LEXER_SCILAB, ".sce", ".sci"],
  [StreamLanguage.define(shell), IDM_LEXER_BASH, ".bash", ".sh"],
  [StreamLanguage.define(shell), IDM_LEXER_CSHELL, ".csh", ".tcsh"],
  [StreamLanguage.define(shell), IDM_LEXER_M4, ".m4", ".ac"],

  // TODO: to figure out
  [null, IDM_LEXER_CSV, ""],
  [null, IDM_LEXER_HSS, ""],
  [null, IDM_LEXER_JSP, ""],
  [null, IDM_LEXER_ASPX_CS, ""],
  [null, IDM_LEXER_ASPX_VB, ""],
  [null, IDM_LEXER_ASP_VBS, ""],
  [null, IDM_LEXER_ASP_JS, ""],
  [null, , ""], // TODO: shell?
  [null, IDM_LEXER_XSD, ""],
  [null, IDM_LEXER_XSLT, ""],
  [null, IDM_LEXER_DTD, ""],
  [null, IDM_LEXER_ANT_BUILD, ""],
  [null, IDM_LEXER_MAVEN_POM, ""],
  [null, IDM_LEXER_MAVEN_SETTINGS, ""],
  [null, IDM_LEXER_IVY_MODULE, ""],
  [null, IDM_LEXER_IVY_SETTINGS, ""],
  [null, IDM_LEXER_PMD_RULESET, ""],
  [null, IDM_LEXER_CHECKSTYLE, ""],
  [null, IDM_LEXER_APACHE, ""],
  [null, IDM_LEXER_TOMCAT, ""],
  [null, IDM_LEXER_WEB_JAVA, ""],
  [null, IDM_LEXER_STRUTS, ""],
  [null, IDM_LEXER_HIB_CFG, ""],
  [null, IDM_LEXER_HIB_MAP, ""],
  [null, IDM_LEXER_SPRING_BEANS, ""],
  [null, IDM_LEXER_JBOSS, ""],
  [null, IDM_LEXER_PROPERTY_LIST, ""],
  [null, IDM_LEXER_ANDROID_MANIFEST, ""],
  [null, IDM_LEXER_ANDROID_LAYOUT, ""],
];

/**
 * @param {string} fileName
 * @returns {any}
 */
export function getLangFromFileName(fileName) {
  function findByExtOrName(s) {
    for (let lang of langs) {
      for (let i = 2; i < len(lang); i++) {
        if (lang[i] == s) {
          return lang[0];
        }
      }
    }
    return null;
  }

  // first try exact file name match
  const name = fileName.toLowerCase();
  const lang = findByExtOrName(name);
  if (lang) {
    return lang;
  }
  // now match by file extension
  const ext = getFileExt(fileName).toLowerCase();
  if (ext === "") {
    return null;
  }
  return findByExtOrName(ext);
}

export function getLangFromLexer(lexer) {
  for (let lang of langs) {
    for (let i = 2; i < len(lang); i++) {
      if (lang[1] == lexer) {
        return lang[0];
      }
    }
  }
  return null;
}

export function getLangName(lang) {
  if (lang.name) {
    return lang.name;
  }
  return lang.language.name;
}
