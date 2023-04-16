import {
  findNodeOfType,
  renderToText,
  replaceNodesMatching,
} from "$sb/lib/tree.js";

import { markdown } from "$sb/silverbullet-syscall/mod.js";
export function encodePageUrl(name) {
  return name.replaceAll(" ", "_");
}
export async function cleanMarkdown(text, validPages) {
  const mdTree = await markdown.parseMarkdown(text);
  replaceNodesMatching(mdTree, (n) => {
    if (n.type === "WikiLink") {
      const page = n.children[1].children[0].text;
      if (validPages && !validPages.includes(page)) {
        return {
          text: `_${page}_`,
        };
      }
      return {
        text: `[${page}](/${encodePageUrl(page)})`,
      };
    }
    if (
      n.type === "CommentBlock" ||
      n.type === "Comment" ||
      n.type === "NamedAnchor"
    ) {
      return null;
    }
    if (n.type === "Hashtag") {
      return {
        text: `__${n.children[0].text}__`,
      };
    }
    if (n.type === "URL") {
      const url = n.children[0].text;
      if (url.indexOf("://") === -1) {
        n.children[0].text = `fs/${url}`;
      }
      console.log("Link", url);
    }
    if (n.type === "FencedCode") {
      const codeInfoNode = findNodeOfType(n, "CodeInfo");
      if (!codeInfoNode) {
        return;
      }
      if (codeInfoNode.children[0].text === "meta") {
        return null;
      }
    }
  });
  return renderToText(mdTree);
}
