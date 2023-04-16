import * as YAML from "yaml";

import { applyQuery, removeQueries } from "$sb/lib/query.js";
import { collectNodesOfType, findNodeOfType } from "$sb/lib/tree.js";

import { index } from "$sb/silverbullet-syscall/mod.js";
export async function indexData({ name, tree }) {
  const dataObjects = [];
  removeQueries(tree);
  collectNodesOfType(tree, "FencedCode").forEach((t) => {
    const codeInfoNode = findNodeOfType(t, "CodeInfo");
    if (!codeInfoNode) {
      return;
    }
    if (codeInfoNode.children[0].text !== "data") {
      return;
    }
    const codeTextNode = findNodeOfType(t, "CodeText");
    if (!codeTextNode) {
      return;
    }
    const codeText = codeTextNode.children[0].text;
    try {
      const docs = codeText.split("---").map((d) => YAML.parse(d));
      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        if (!doc) {
          continue;
        }
        dataObjects.push({
          key: `data:${name}@${t.from + i}`,
          value: doc,
        });
      }
    } catch (e) {
      console.error("Could not parse data", codeText, "error:", e);
      return;
    }
  });
  await index.batchSet(name, dataObjects);
}
export async function queryProvider({ query }) {
  const allData = [];
  for (const { key, page, value } of await index.queryPrefix("data:")) {
    const [, pos] = key.split("@");
    allData.push({
      ...value,
      page,
      pos: +pos,
    });
  }
  return applyQuery(query, allData);
}
