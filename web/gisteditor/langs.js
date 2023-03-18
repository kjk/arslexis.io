import { fileExt } from "../util.js";

// 0 - array of extensions
// 1 - language name as recognized by th editor
// 2 - human readable name
// languages: https://microsoft.github.io/monaco-editor/
export const langs = [
  [[".go"], "go", "Go"],
  [[".lua"], "text/x-lua", "Lua"],
  [[".md", ".markdown"], "text/x-markdown", "Markdown"],
  [[".js"], "javascript", "JavaScript"],
  [[".json", ".json5"], "application/json", "JSON"],
  [[".ts"], "text/typescript", "TypeScript"],
  [[".py"], "python", "Python"],
  [[".c", ".h"], "text/x-csrc", "C"],
  [[".cc", ".cpp", ".cxx", ".hpp", ".hxx"], "text/x-c++src", "C++"],
  [[".cs"], "text/x-csharp", "C#"],
  [[".java"], "text/x-java", "Java"],
  [[".diff"], "text/x-diff", "Diff"],
  [[".html", ".svelte"], "htmlmixed", "HTML"],
  [[".svelte"], "htmlmixed", "Svelte"],
  [[".css"], "text/css", "CSS"],
  [[".xml"], "application/xml", "XML"],
  [[".dart"], "dart", "Dart"],
  [[".yml", ".yaml"], "text/x-yaml", "Yaml"],
];

/**
 *
 * @param {*} li
 * @returns {string[]}
 */
export function langExts(li) {
  return li[0];
}

/**
 *
 * @param {*} li
 * @returns {string}
 */
export function langMonacoMode(li) {
  return li[1];
}

/**
 *
 * @param {*} li
 * @returns {string}
 */
export function langHumanName(li) {
  return li[2];
}

export function getLangNames() {
  const d = {};
  for (let li of langs) {
    const name = langHumanName(li);
    d[name] = true;
  }
  let names = Object.keys(d);
  names.sort();
  return names;
}

const normalizedLangNames = {
  ts: "TypeScript",
  golang: "Go",
  cpp: "C++",
  csharp: "C#",
  js: "JavaScript",
};

/**
 *
 * @param {string} lang
 * @returns {string}
 */
export function normalizeLangName(lang) {
  const langlc = lang.toLowerCase();
  // do the fast thing first
  const normalized = normalizedLangNames[langlc];
  if (normalized) {
    console.log("normalizeLangName: lang:", lang, "normalized:", normalized);
    return normalized;
  }

  // validate
  for (let li of langs) {
    // @ts-ignore TODO: better way to silence it
    const name = langHumanName(li);
    if (langlc === name.toLowerCase()) {
      console.log("normalizeLangName: lang:", lang, "normalized:", name);
      return name;
    }
  }
  console.log("normalizeLangName: lang:", lang, " is unknown");
  return "";
}

/**
 *
 * @param {string} fext
 * @returns {*}
 */
export function getLangInfoFromFileExt(fext) {
  for (let li of langs) {
    let exts = langExts(li);
    for (let ext of exts) {
      if (fext === ext) {
        return li;
      }
    }
  }
  return null;
}

/**
 * Python => .py etc.
 * @param {string} lang
 * @returns {string}
 */
export function getLangExtFromLangName(lang) {
  lang = normalizeLangName(lang);
  lang = lang.toLowerCase();
  for (let li of langs) {
    // @ts-ignore TODO: better way to silence it
    const name = langHumanName(li).toLowerCase();
    if (name === lang) {
      return langExts(li)[0];
    }
  }
  return ".txt";
}

/**
 * @param {string} fileName
 * @returns {string}
 */
function getLangInfoFromFileName(fileName) {
  const ext = fileExt(fileName);
  return getLangInfoFromFileExt(ext);
}

const docsForLang = {
  go: [["Go standard library docs", "https://pkg.go.dev/std?tab=packages"]],
};

/**
 * return an array of docs for a given file name
 * @param {string} fileName
 * @returns {string[][]}
 */
export function docsForFile(fileName) {
  fileName = fileName.toLowerCase();
  if (fileName === "codeeval.yml") {
    return [["codeeval.yml syntax", "https://docs.onlinetool.io/gist-editor"]];
  }
  const li = getLangInfoFromFileName(fileName);
  if (!li) {
    return null;
  }
  const lang = langHumanName(li).toLowerCase();
  return docsForLang[lang] || [];
}

const goSampleContent = `package main

import (
	"fmt"
)

func main() {
	fmt.Printf("Hello\\n")
}
`;

const jsSampleContent = `console.log("Hello world!");
`;

const cppSampleContent = `#include <iostream>

int main()
{
    std::cout << "Hello World!" << std::endl;
		return 0;
}
`;

// TODO: more
const langNameToSampleContent = {
  go: goSampleContent,
  javascript: jsSampleContent,
  "c++": cppSampleContent,
};

export function getSampleContentForLang(lang) {
  lang = normalizeLangName(lang).toLowerCase();
  console.log("getSampleContentForLang:", lang);
  return langNameToSampleContent[lang] || "";
}
