import { applyQuery, removeQueries } from "$sb/lib/query.js";
import { editor, index } from "$sb/silverbullet-syscall/mod.js";

import { base64EncodedDataUrl } from "../../plugos/asset_bundle/base64.js";
import { fulltext } from "$sb/plugos-syscall/mod.js";
import { renderToText } from "$sb/lib/tree.js";
const searchPrefix = "\u{1F50D} ";
export async function pageIndex(data) {
  removeQueries(data.tree);
  const cleanText = renderToText(data.tree);
  await fulltext.fullTextIndex(data.name, cleanText);
}
export async function pageUnindex(pageName) {
  await fulltext.fullTextDelete(pageName);
}
export async function queryProvider({ query }) {
  const phraseFilter = query.filter.find((f) => f.prop === "phrase");
  if (!phraseFilter) {
    throw Error("No 'phrase' filter specified, this is mandatory");
  }
  let results = await fulltext.fullTextSearch(phraseFilter.value, {
    highlightEllipsis: "...",
    limit: 100,
  });
  const allPageMap = new Map(results.map((r) => [r.name, r]));
  for (const { page, value } of await index.queryPrefix("meta:")) {
    const p = allPageMap.get(page);
    if (p) {
      for (const [k, v] of Object.entries(value)) {
        p[k] = v;
      }
    }
  }
  query.filter.splice(query.filter.indexOf(phraseFilter), 1);
  results = applyQuery(query, results);
  return results;
}
export async function searchCommand() {
  const phrase = await editor.prompt("Search for: ");
  if (phrase) {
    await editor.navigate(`${searchPrefix}${phrase}`);
  }
}
export async function readFileSearch(name, encoding) {
  const phrase = name.substring(
    searchPrefix.length,
    name.length - ".md".length
  );
  const results = await fulltext.fullTextSearch(phrase, {
    highlightEllipsis: "...",
    highlightPostfix: "==",
    highlightPrefix: "==",
    summaryMaxLength: 30,
    limit: 100,
  });
  const text = `# Search results for "${phrase}"
${results
  .map(
    (r) => `[[${r.name}]]:
> ${r.snippet.split("\n").join("\n> ")}`
  )
  .join("\n\n")}
  `;
  return {
    data:
      encoding === "utf8"
        ? text
        : base64EncodedDataUrl("text/markdown", new TextEncoder().encode(text)),
    meta: {
      name,
      contentType: "text/markdown",
      size: text.length,
      lastModified: 0,
      perm: "ro",
    },
  };
}
export function getFileMetaSearch(name) {
  return {
    name,
    contentType: "text/markdown",
    size: -1,
    lastModified: 0,
    perm: "ro",
  };
}
