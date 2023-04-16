import { applyQuery, removeQueries } from "$sb/lib/query.js";

import { collectNodesOfType } from "$sb/lib/tree.js";
import { extractFrontmatter } from "../../plug-api/lib/frontmatter.js";
import { index } from "$sb/silverbullet-syscall/mod.js";
export async function indexTags({ name, tree }) {
  removeQueries(tree);
  const allTags = /* @__PURE__ */ new Set();
  const { tags } = extractFrontmatter(tree);
  if (Array.isArray(tags)) {
    tags.forEach((t) => allTags.add(t));
  }
  collectNodesOfType(tree, "Hashtag").forEach((n) => {
    allTags.add(n.children[0].text.substring(1));
  });
  await index.batchSet(
    name,
    [...allTags].map((t) => ({ key: `tag:${t}`, value: t }))
  );
}
export async function tagComplete(completeEvent) {
  const match = /#[^#\s]+$/.exec(completeEvent.linePrefix);
  if (!match) {
    return null;
  }
  const tagPrefix = match[0].substring(1);
  const allTags = await index.queryPrefix(`tag:${tagPrefix}`);
  return {
    from: completeEvent.pos - tagPrefix.length,
    options: allTags.map((tag) => ({
      label: tag.value,
      type: "tag",
    })),
  };
}
export async function tagProvider({ query }) {
  const allTags = /* @__PURE__ */ new Map();
  for (const { value } of await index.queryPrefix("tag:")) {
    let currentFreq = allTags.get(value);
    if (!currentFreq) {
      currentFreq = 0;
    }
    allTags.set(value, currentFreq + 1);
  }
  return applyQuery(
    query,
    [...allTags.entries()].map(([name, freq]) => ({
      name,
      freq,
    }))
  );
}
