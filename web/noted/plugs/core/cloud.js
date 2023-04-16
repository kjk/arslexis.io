import { renderToText, replaceNodesMatching } from "$sb/lib/tree.js";

import { base64EncodedDataUrl } from "../../plugos/asset_bundle/base64.js";
import { parseMarkdown } from "$sb/silverbullet-syscall/markdown.js";
export const cloudPrefix = "\u{1F4AD} ";
export async function readFileCloud(name, encoding) {
  const originalUrl = name.substring(
    cloudPrefix.length,
    name.length - ".md".length
  );
  let url = originalUrl;
  if (!url.includes("/")) {
    url += "/index";
  }
  if (!url.startsWith("127.0.0.1")) {
    url = `https://${url}`;
  } else {
    url = `http://${url}`;
  }
  let text = "";
  try {
    const r = await fetch(`${encodeURI(url)}.md`);
    text = await r.text();
    if (!r.ok) {
      text = `ERROR: ${text}`;
    }
  } catch (e) {
    console.error("ERROR thrown", e.message);
    text = `ERROR: ${e.message}`;
  }
  text = await translateLinksWithPrefix(
    text,
    `${cloudPrefix}${originalUrl.split("/")[0]}/`
  );
  return {
    data:
      encoding === "utf8"
        ? text
        : base64EncodedDataUrl("text/markdown", new TextEncoder().encode(text)),
    meta: {
      name,
      contentType: "text/markdown",
      lastModified: 0,
      size: text.length,
      perm: "ro",
    },
  };
}
async function translateLinksWithPrefix(text, prefix) {
  const tree = await parseMarkdown(text);
  replaceNodesMatching(tree, (tree2) => {
    if (tree2.type === "WikiLinkPage") {
      if (!tree2.children[0].text.startsWith(cloudPrefix)) {
        tree2.children[0].text = prefix + tree2.children[0].text;
      }
    }
    return void 0;
  });
  text = renderToText(tree);
  return text;
}
export function getFileMetaCloud(name) {
  return Promise.resolve({
    name,
    size: 0,
    contentType: "text/markdown",
    lastModified: 0,
    perm: "ro",
  });
}
