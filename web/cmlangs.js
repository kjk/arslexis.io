// https://codemirror.net/5/mode/index.html
// https://github.com/codemirror/legacy-modes/blob/main/mode/README.md
// https://gist.github.com/rooks/6a13affb544ef8bc338b49af7d018318 csv mode

// TODO: more https://github.com/codemirror/legacy-modes

/** @typedef { import("@codemirror/language").LanguageSupport} LanguageSupport */

import { StreamLanguage } from "@codemirror/language";
import * as m from "./notepad2/menu-notepad2";
import { getFileExt } from "./fileutil";
import { len, throwIf } from "./util";

// see Style_UpdateLexerLang in Styles.c

let langSql;
// TODO: different dialects: MySQL, PostgreSQL etc.
async function getLangSql() {
  if (!langSql) {
    const m = await import("@codemirror/lang-sql");
    langSql = m.sql();
  }
  return langSql;
}

let langCpp;
async function getLangCpp() {
  if (!langCpp) {
    const m = await import("@codemirror/lang-cpp");
    langCpp = m.cpp();
  }
  return langCpp;
}

let langPhp;
async function getLangPhp() {
  if (!langPhp) {
    const m = await import("@codemirror/lang-php");
    langPhp = m.php();
  }
  return langPhp;
}

let langPython;
async function getLangPython() {
  if (!langPython) {
    const m = await import("@codemirror/lang-python");
    langPython = m.python();
  }
  return langPython;
}

let langRust;
async function getLangRust() {
  if (!langRust) {
    const m = await import("@codemirror/lang-rust");
    langRust = m.rust();
  }
  return langRust;
}

let langSvelte;
async function getLangSvelte() {
  if (!langSvelte) {
    const m = await import("@replit/codemirror-lang-svelte");
    langSvelte = m.svelte();
  }
  return langSvelte;
}

let langJson;
async function getLangJson() {
  if (!langJson) {
    const m = await import("@codemirror/lang-json");
    langJson = m.json();
  }
  return langJson;
}

let langXml;
async function getLangXml() {
  if (!langXml) {
    const m = await import("@codemirror/lang-xml");
    langXml = m.xml();
  }
  return langXml;
}

let langJavascript;
async function getLangJavaScript() {
  if (!langJavascript) {
    const m = await import("@codemirror/lang-javascript");
    langJavascript = m.javascript();
  }
  return langJavascript;
}

let langCSS;
async function getLangCSS() {
  if (!langCSS) {
    const m = await import("@codemirror/lang-css");
    langCSS = m.css();
  }
  return langCSS;
}

let langHTML;
async function getLangHTML() {
  if (!langHTML) {
    const m = await import("@codemirror/lang-html");
    langHTML = m.html();
  }
  return langHTML;
}

let langJava;
async function getLangJava() {
  if (!langJava) {
    const m = await import("@codemirror/lang-java");
    langJava = m.java();
  }
  return langJava;
}

let langVue;
async function getLangVue() {
  if (!langVue) {
    const m = await import("@codemirror/lang-vue");
    langVue = m.vue();
  }
  return langVue;
}

let langMarkdown;
async function getLangMarkdown() {
  if (!langMarkdown) {
    const m = await import("@codemirror/lang-markdown");
    langMarkdown = m.markdown();
  }
  return langMarkdown;
}

let langLua;
async function getLangLua() {
  if (!langLua) {
    const m = await import("@codemirror/legacy-modes/mode/lua");
    langLua = StreamLanguage.define(m.lua);
  }
  return langLua;
}

let langGo;
async function getLangGo() {
  if (!langGo) {
    const m = await import("@codemirror/legacy-modes/mode/go");
    langGo = StreamLanguage.define(m.go);
  }
  return langGo;
}

let langDiff;
async function getLangDiff() {
  if (!langDiff) {
    const m = await import("@codemirror/legacy-modes/mode/diff");
    langLua = StreamLanguage.define(m.diff);
  }
  return langDiff;
}

let langScss;
async function getLangScss() {
  if (!langScss) {
    const m = await import("@codemirror/legacy-modes/mode/css");
    langScss = StreamLanguage.define(m.sCSS);
  }
  return langScss;
}

let langLess;
async function getLangLess() {
  if (!langLess) {
    const m = await import("@codemirror/legacy-modes/mode/css");
    langLess = StreamLanguage.define(m.less);
  }
  return langLess;
}

let langOctave;
async function getLangOctave() {
  if (!langOctave) {
    const m = await import("@codemirror/legacy-modes/mode/octave");
    langOctave = StreamLanguage.define(m.octave);
  }
  return langOctave;
}

let langShell;
async function getLangShell() {
  if (!langShell) {
    const m = await import("@codemirror/legacy-modes/mode/shell");
    langShell = StreamLanguage.define(m.shell);
  }
  return langShell;
}

let langRuby;
async function getLangRuby() {
  if (!langRuby) {
    const m = await import("@codemirror/legacy-modes/mode/ruby");
    langRuby = StreamLanguage.define(m.ruby);
  }
  return langRuby;
}

let langCSharp;
async function getLangCSharp() {
  if (!langCSharp) {
    const m = await import("@codemirror/legacy-modes/mode/clike");
    langCSharp = StreamLanguage.define(m.csharp);
  }
  return langCSharp;
}

async function getLexerDynamic(id) {
  switch (id) {
    case m.IDM_LEXER_RUBY:
      return await getLangRuby();
    case m.IDM_LEXER_JS:
    case m.IDM_LEXER_ACTIONSCRIPT:
      return await getLangJavaScript();
    case m.IDM_LEXER_HTML:
      return await getLangHTML();
    case m.IDM_LEXER_CSS:
      return await getLangCSS();
    case m.IDM_LEXER_JAVA:
      return await getLangJava();
    case m.IDM_LEXER_VUE:
      return await getLangVue();
    case m.IDM_LEXER_MARKDOWN:
    case m.IDM_LEXER_MARKDOWN_GITHUB:
    case m.IDM_LEXER_MARKDOWN_GITLAB:
    case m.IDM_LEXER_MARKDOWN_PANDOC:
      return await getLangMarkdown();
    case m.IDM_LEXER_LUA:
      return await getLangLua();
    case m.IDM_LEXER_GO:
      return await getLangGo();
    case m.IDM_LEXER_DIFF:
      return await getLangDiff();
    case m.IDM_LEXER_SCSS:
      return await getLangScss();
    case m.IDM_LEXER_LESS:
      return await getLangLess();
    case m.IDM_LEXER_OCTAVE:
    case m.IDM_LEXER_MATLAB:
    case m.IDM_LEXER_SCILAB:
      return await getLangOctave();
    case m.IDM_LEXER_BASH:
    case m.IDM_LEXER_CSHELL:
    case m.IDM_LEXER_M4:
      return await getLangShell();
    case m.IDM_LEXER_RUBY:
      return await getLangRuby();
    case m.IDM_LEXER_CSHARP:
      return await getLangCSharp();
    case m.IDM_LEXER_JSON:
      return await getLangJson();
    case m.IDM_LEXER_XML:
      return await getLangXml();
    case m.IDM_LEXER_RUST:
      return await getLangRust();
    case m.IDM_LEXER_SQL:
      return await getLangSql();
    case m.IDM_LEXER_PYTHON:
      return await getLangPython();
    case m.IDM_LEXER_CPP:
      return await getLangCpp();
    case m.IDM_LEXER_SVELTE:
      return await getLangSvelte();
    case m.IDM_LEXER_PHP:
      return await getLangPhp();
  }

  return null;
}

const langs = [
  [null, m.IDM_LEXER_JS, ".js", ".ts", ".jsx", ".tsx"],
  [null, m.IDM_LEXER_ACTIONSCRIPT, ".as"],
  [
    null,
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
    null,
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
  [null, m.IDM_LEXER_RUST, ".rs"],
  [null, m.IDM_LEXER_SQL, ".sql"],
  [null, m.IDM_LEXER_PYTHON, ".py"],
  [null, m.IDM_LEXER_CPP, ".c", ".cpp", ".c++", ".cxx", ".h", ".hpp", ".hxx"],
  [null, m.IDM_LEXER_SVELTE, ".svelte"],
  [null, m.IDM_LEXER_PHP, ".php"],
  [null, m.IDM_LEXER_LUA, ".lua"],
  [null, m.IDM_LEXER_GO, ".go"],
  [null, m.IDM_LEXER_DIFF, ".diff"],

  [null, m.IDM_LEXER_SCSS, ".scss"],
  [null, m.IDM_LEXER_LESS, ".less"],
  [null, m.IDM_LEXER_OCTAVE, ".octave"],
  [null, m.IDM_LEXER_MATLAB, ".m"],
  [null, m.IDM_LEXER_SCILAB, ".sce", ".sci"],
  [null, m.IDM_LEXER_BASH, ".bash", ".sh"],
  [null, m.IDM_LEXER_CSHELL, ".csh", ".tcsh"],
  [null, m.IDM_LEXER_M4, ".m4", ".ac"],
  [
    null,
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
  [null, m.IDM_LEXER_CSHARP, ".cs", ".csx", ".vala", ".vapi"],

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
