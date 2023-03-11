// https://codemirror.net/5/mode/index.html
// https://github.com/codemirror/legacy-modes/blob/main/mode/README.md
// https://gist.github.com/rooks/6a13affb544ef8bc338b49af7d018318 csv mode
// import { javascript } from "@codemirror/lang-javascript";
// import { css } from "@codemirror/lang-css";
// import { html } from "@codemirror/lang-html";
// import { java } from "@codemirror/lang-java";
// import { vue } from "@codemirror/lang-vue";
// import { angular } from "@codemirror/lang-angular";
// import { wast } from "@codemirror/lang-wast";
// import { markdown } from "@codemirror/lang-markdown";

import { xml } from "@codemirror/lang-xml";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { python } from "@codemirror/lang-python";
import { php } from "@codemirror/lang-php";
import { cpp } from "@codemirror/lang-cpp";
import { json } from "@codemirror/lang-json";
import { svelte } from "@replit/codemirror-lang-svelte";

// TODO: more https://github.com/codemirror/legacy-modes
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { go } from "@codemirror/legacy-modes/mode/go";
import { diff } from "@codemirror/legacy-modes/mode/diff";

// legacy modes
import { StreamLanguage } from "@codemirror/language";
import { sCSS, less } from "@codemirror/legacy-modes/mode/css";
import { octave } from "@codemirror/legacy-modes/mode/octave";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { csharp, dart } from "@codemirror/legacy-modes/mode/clike";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";

import { getFileExt } from "./fileutil";
import { len, throwIf } from "./util";

/** @typedef { import("@codemirror/language").LanguageSupport} LanguageSupport */

import * as m from "./notepad2/menu-notepad2";

// see Style_UpdateLexerLang in Styles.c

let lexerJavascript;
let lexerCSS;
let lexerHTML;
let lexerJava;
let lexerVue;
let lexerMarkdown;

async function getLexerDynamic(id) {
  switch (id) {
    case m.IDM_LEXER_JS:
    case m.IDM_LEXER_ACTIONSCRIPT:
      if (!lexerJavascript) {
        const o = await import("@codemirror/lang-javascript");
        lexerJavascript = o.javascript();
      }
      return lexerJavascript;
    case m.IDM_LEXER_HTML:
      if (!lexerHTML) {
        const o = await import("@codemirror/lang-html");
        lexerHTML = o.html();
      }
      return lexerHTML;
    case m.IDM_LEXER_CSS:
      if (!lexerCSS) {
        const o = await import("@codemirror/lang-css");
        lexerCSS = o.css();
      }
      return lexerCSS;
    case m.IDM_LEXER_JAVA:
      if (!lexerJava) {
        const o = await import("@codemirror/lang-java");
        lexerJava = o.java();
      }
      return lexerJava;
    case m.IDM_LEXER_VUE:
      if (!lexerVue) {
        const o = await import("@codemirror/lang-vue");
        lexerVue = o.vue();
      }
      return lexerVue;
    case m.IDM_LEXER_MARKDOWN:
    case m.IDM_LEXER_MARKDOWN_GITHUB:
    case m.IDM_LEXER_MARKDOWN_GITLAB:
    case m.IDM_LEXER_MARKDOWN_PANDOC:
      if (!lexerMarkdown) {
        const o = await import("@codemirror/lang-markdown");
        lexerMarkdown = o.markdown();
      }
      return lexerMarkdown;
  }
  return null;
}

const langs = [
  [null, m.IDM_LEXER_JS, ".js", ".ts", ".jsx", ".tsx"],
  [null, m.IDM_LEXER_ACTIONSCRIPT, ".as"],
  [
    json(),
    m.IDM_LEXER_JSON,
    ".json",
    ".har",
    ".ipynb",
    ".wxcp",
    ".jshintrc",
    ".eslintrc",
    ".babelrc",
    ".prettierrc",
    ".stylelintrc",
    ".jsonld",
    ".jsonc",
    ".arcconfig",
    ".arclint",
    ".jscop",
  ],
  [null, m.IDM_LEXER_CSS, ".css"],
  [
    null,
    m.IDM_LEXER_HTML,
    ".html",
    "htm",
    "shtml",
    "xhtml",
    "asp",
    "aspx",
    "jsp",
    "mht",
    "htd",
    "htt",
    "hta",
    "htc",
    "cfm",
    "tpl",
    "jd",
  ],
  [null, m.IDM_LEXER_JAVA, ".java"],
  [null, m.IDM_LEXER_VUE, ".vue"],
  [null, m.IDM_LEXER_MARKDOWN, ".md", ".markdown"],
  [null, m.IDM_LEXER_MARKDOWN_GITHUB, ".md", ".markdown"],
  [null, m.IDM_LEXER_MARKDOWN_GITLAB, ".md", ".markdown"],
  [null, m.IDM_LEXER_MARKDOWN_PANDOC, ".md", ".markdown"],
  [
    xml(),
    m.IDM_LEXER_XML,
    ".xml",
    ".xsl",
    ".xslt",
    ".xsd",
    ".dtd",
    ".rss",
    ".svg",
    ".xul",
    ".axl",
    ".rdf",
    ".xaml",
    ".resx",
    ".plist",
    ".pom",
    ".mm",
    ".xrc",
    ".fbp",
    ".wxml",
  ],
  [rust(), m.IDM_LEXER_RUST, ".rs"],
  [sql(), m.IDM_LEXER_SQL, ".sql"],
  [python(), m.IDM_LEXER_PYTHON, ".py"],
  [cpp(), m.IDM_LEXER_CPP, ".c", ".cpp", ".c++", ".cxx", ".h", ".hpp", ".hxx"],
  [svelte(), m.IDM_LEXER_SVELTE, ".svelte"],
  [php(), m.IDM_LEXER_PHP, ".php"],
  [StreamLanguage.define(lua), m.IDM_LEXER_LUA, ".lua"],
  [StreamLanguage.define(go), m.IDM_LEXER_GO, ".go"],
  [StreamLanguage.define(diff), m.IDM_LEXER_DIFF, ".diff"],

  [StreamLanguage.define(sCSS), m.IDM_LEXER_SCSS, ".scss"],
  [StreamLanguage.define(less), m.IDM_LEXER_LESS, ".scss"],
  [StreamLanguage.define(octave), m.IDM_LEXER_OCTAVE, ".octave"],
  [StreamLanguage.define(octave), m.IDM_LEXER_MATLAB, ".m"],
  [StreamLanguage.define(octave), m.IDM_LEXER_SCILAB, ".sce", ".sci"],
  [StreamLanguage.define(shell), m.IDM_LEXER_BASH, ".bash", ".sh"],
  [StreamLanguage.define(shell), m.IDM_LEXER_CSHELL, ".csh", ".tcsh"],
  [StreamLanguage.define(shell), m.IDM_LEXER_M4, ".m4", ".ac"],
  [
    StreamLanguage.define(ruby),
    m.IDM_LEXER_RUBY,
    ".rb",
    ".ruby",
    ".rbw",
    ".rake",
    ".rjs",
    ".gemspec",
    ".podspec",
    ".cr",
  ],
  [
    StreamLanguage.define(csharp),
    m.IDM_LEXER_CSHARP,
    ".cs",
    ".csx",
    ".vala",
    ".vapi",
  ],

  /*
  // TODO: to figure out
  [null, m.IDM_LEXER_CSV, ""],
  [null, m.IDM_LEXER_HSS, ""],
  [null, m.IDM_LEXER_JSP, ""],
  [null, m.IDM_LEXER_ASPX_CS, ""],
  [null, m.IDM_LEXER_ASPX_VB, ""],
  [null, m.IDM_LEXER_ASP_VBS, ""],
  [null, m.IDM_LEXER_ASP_JS, ""],
  [null, , ""], // TODO: shell?
  [null, m.IDM_LEXER_XSD, ""],
  [null, m.IDM_LEXER_XSLT, ""],
  [null, m.IDM_LEXER_DTD, ""],
  [null, m.IDM_LEXER_ANT_BUILD, ""],
  [null, m.IDM_LEXER_MAVEN_POM, ""],
  [null, m.IDM_LEXER_MAVEN_SETTINGS, ""],
  [null, m.IDM_LEXER_IVY_MODULE, ""],
  [null, m.IDM_LEXER_IVY_SETTINGS, ""],
  [null, m.IDM_LEXER_PMD_RULESET, ""],
  [null, m.IDM_LEXER_CHECKSTYLE, ""],
  [null, m.IDM_LEXER_APACHE, ""],
  [null, m.IDM_LEXER_TOMCAT, ""],
  [null, m.IDM_LEXER_WEB_JAVA, ""],
  [null, m.IDM_LEXER_STRUTS, ""],
  [null, m.IDM_LEXER_HIB_CFG, ""],
  [null, m.IDM_LEXER_HIB_MAP, ""],
  [null, m.IDM_LEXER_SPRING_BEANS, ""],
  [null, m.IDM_LEXER_JBOSS, ""],
  [null, m.IDM_LEXER_PROPERTY_LIST, ""],
  [null, m.IDM_LEXER_ANDROID_MANIFEST, ""],
  [null, m.IDM_LEXER_ANDROID_LAYOUT, ""],
  */
];

async function getDelayedLang(langInfo) {
  if (langInfo[0] === null) {
    langInfo[0] = await getLexerDynamic(langInfo[1]);
  }
  return langInfo[0];
}

/**
 * @param {string} fileName
 * @returns {Promise<any>}
 */
export async function getCMLangFromFileName(fileName) {
  const name = fileName.toLowerCase();
  const ext = getFileExt(fileName).toLowerCase();
  for (let langInfo of langs) {
    for (let i = 2; i < len(langInfo); i++) {
      let lext = langInfo[i];
      throwIf(lext === "");
      if (lext === name || lext === ext) {
        return await getDelayedLang(langInfo);
      }
    }
  }
  return null;
}

export async function getCMLangFromLexer(lexer) {
  for (let lang of langs) {
    for (let i = 2; i < len(lang); i++) {
      if (lang[1] == lexer) {
        return getDelayedLang(lang);
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
