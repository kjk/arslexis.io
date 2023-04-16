import {
  addParentPointers,
  collectNodesMatching,
  renderToText,
  replaceNodesMatching,
} from "$sb/lib/tree.js";
import {
  editor,
  index,
  markdown,
  space,
  system,
} from "$sb/silverbullet-syscall/mod.js";

import { applyQuery } from "$sb/lib/query.js";
import { events } from "$sb/plugos-syscall/mod.js";
import { extractFrontmatter } from "$sb/lib/frontmatter.js";
export async function indexLinks({ name, tree }) {
  const backLinks = [];
  const pageMeta = extractFrontmatter(tree);
  if (Object.keys(pageMeta).length > 0) {
    for (const key in pageMeta) {
      if (key.startsWith("$")) {
        delete pageMeta[key];
      }
    }
    await index.set(name, "meta:", pageMeta);
  }
  collectNodesMatching(tree, (n) => n.type === "WikiLinkPage").forEach((n) => {
    let toPage = n.children[0].text;
    if (toPage.includes("@")) {
      toPage = toPage.split("@")[0];
    }
    backLinks.push({
      key: `pl:${toPage}:${n.from}`,
      value: name,
    });
  });
  await index.batchSet(name, backLinks);
}
export async function pageQueryProvider({ query }) {
  return applyQuery(query, await space.listPages());
}
export async function linkQueryProvider({ query, pageName }) {
  const links = [];
  for (const { value: name, key } of await index.queryPrefix(
    `pl:${pageName}:`
  )) {
    const [, , pos] = key.split(":");
    links.push({ name, pos });
  }
  return applyQuery(query, links);
}
export async function deletePage() {
  const pageName = await editor.getCurrentPage();
  if (
    !(await editor.confirm(
      `Are you sure you would like to delete ${pageName}?`
    ))
  ) {
    return;
  }
  console.log("Navigating to index page");
  await editor.navigate("");
  console.log("Deleting page from space");
  await space.deletePage(pageName);
}
export async function renamePage(cmdDef) {
  console.log("Got a target name", cmdDef.page);
  const oldName = await editor.getCurrentPage();
  const cursor = await editor.getCursor();
  console.log("Old name is", oldName);
  const newName =
    cmdDef.page || (await editor.prompt(`Rename ${oldName} to:`, oldName));
  if (!newName) {
    return;
  }
  console.log("New name", newName);
  if (newName.trim() === oldName.trim()) {
    console.log("Name unchanged, exiting");
    return;
  }
  try {
    await space.getPageMeta(newName);
    throw new Error(
      `Page ${newName} already exists, cannot rename to existing page.`
    );
  } catch (e) {
    if (e.message.includes("not found")) {
    } else {
      await editor.flashNotification(e.message, "error");
      throw e;
    }
  }
  const pagesToUpdate = await getBackLinks(oldName);
  console.log("All pages containing backlinks", pagesToUpdate);
  const text = await editor.getText();
  console.log("Writing new page to space");
  const newPageMeta = await space.writePage(newName, text);
  console.log("Navigating to new page");
  await editor.navigate(newName, cursor, true);
  const oldPageMeta = await space.getPageMeta(oldName);
  if (oldPageMeta.lastModified !== newPageMeta.lastModified) {
    console.log("Deleting page from space");
    await space.deletePage(oldName);
  }
  const pageToUpdateSet = /* @__PURE__ */ new Set();
  for (const pageToUpdate of pagesToUpdate) {
    pageToUpdateSet.add(pageToUpdate.page);
  }
  let updatedReferences = 0;
  for (const pageToUpdate of pageToUpdateSet) {
    if (pageToUpdate === oldName) {
      continue;
    }
    console.log("Now going to update links in", pageToUpdate);
    const text2 = await space.readPage(pageToUpdate);
    if (!text2) {
      continue;
    }
    const mdTree = await markdown.parseMarkdown(text2);
    addParentPointers(mdTree);
    replaceNodesMatching(mdTree, (n) => {
      if (n.type === "WikiLinkPage") {
        const pageName = n.children[0].text;
        if (pageName === oldName) {
          n.children[0].text = newName;
          updatedReferences++;
          return n;
        }
        if (pageName.startsWith(`${oldName}@`)) {
          const [, pos] = pageName.split("@");
          n.children[0].text = `${newName}@${pos}`;
          updatedReferences++;
          return n;
        }
      }
      return;
    });
    const newText = renderToText(mdTree);
    if (text2 !== newText) {
      console.log("Changes made, saving...");
      await space.writePage(pageToUpdate, newText);
    }
  }
  await editor.flashNotification(
    `Renamed page, and updated ${updatedReferences} references`
  );
}
export async function newPageCommand() {
  const allPages = await space.listPages();
  let pageName = `Untitled`;
  let i = 1;
  while (allPages.find((p) => p.name === pageName)) {
    pageName = `Untitled ${i}`;
    i++;
  }
  await editor.navigate(pageName);
}
async function getBackLinks(pageName) {
  const allBackLinks = await index.queryPrefix(`pl:${pageName}:`);
  const pagesToUpdate = [];
  for (const { key, value } of allBackLinks) {
    const keyParts = key.split(":");
    pagesToUpdate.push({
      page: value,
      pos: +keyParts[keyParts.length - 1],
    });
  }
  return pagesToUpdate;
}
export async function reindexCommand() {
  await editor.flashNotification("Reindexing...");
  await system.invokeFunction("server", "reindexSpace");
  await editor.flashNotification("Reindexing done");
}
export async function pageComplete(completeEvent) {
  const match = /\[\[([^\]@:]*)$/.exec(completeEvent.linePrefix);
  if (!match) {
    return null;
  }
  const allPages = await space.listPages();
  return {
    from: completeEvent.pos - match[1].length,
    options: allPages.map((pageMeta) => ({
      label: pageMeta.name,
      boost: pageMeta.lastModified,
      type: "page",
    })),
  };
}
export async function reindexSpace() {
  console.log("Clearing page index...");
  await index.clearPageIndex();
  console.log("Listing all pages");
  const pages = await space.listPages();
  let counter = 0;
  for (const { name } of pages) {
    counter++;
    console.log(`Indexing page ${counter}/${pages.length}: ${name}`);
    const text = await space.readPage(name);
    const parsed = await markdown.parseMarkdown(text);
    await events.dispatchEvent("page:index", {
      name,
      tree: parsed,
    });
  }
  console.log("Indexing completed!");
}
export async function clearPageIndex(page) {
  await index.clearPageIndexForPage(page);
}
export async function parseIndexTextRepublish({ name, text }) {
  console.log("Reindexing", name);
  await events.dispatchEvent("page:index", {
    name,
    tree: await markdown.parseMarkdown(text),
  });
}
