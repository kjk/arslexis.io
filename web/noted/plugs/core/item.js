import { applyQuery, removeQueries } from "$sb/lib/query.js";
import { collectNodesOfType, renderToText } from "$sb/lib/tree.js";

import { index } from "$sb/silverbullet-syscall/mod.js";
export async function indexItems({ name, tree }) {
  const items = [];
  removeQueries(tree);
  const coll = collectNodesOfType(tree, "ListItem");
  coll.forEach((n) => {
    if (!n.children) {
      return;
    }
    if (collectNodesOfType(n, "Task").length > 0) {
      return;
    }
    const textNodes = [];
    let nested;
    for (const child of n.children.slice(1)) {
      if (child.type === "OrderedList" || child.type === "BulletList") {
        nested = renderToText(child);
        break;
      }
      textNodes.push(child);
    }
    const itemText = textNodes.map(renderToText).join("").trim();
    const item = {
      name: itemText,
    };
    if (nested) {
      item.nested = nested;
    }
    collectNodesOfType(n, "Hashtag").forEach((h) => {
      if (!item.tags) {
        item.tags = [];
      }
      item.tags.push(h.children[0].text.substring(1));
    });
    items.push({
      key: `it:${n.from}`,
      value: item,
    });
  });
  await index.batchSet(name, items);
}
export async function queryProvider({ query }) {
  const allItems = [];
  for (const { key, page, value } of await index.queryPrefix("it:")) {
    const [, pos] = key.split(":");
    allItems.push({
      ...value,
      page,
      pos: +pos,
    });
  }
  return applyQuery(query, allItems);
}
