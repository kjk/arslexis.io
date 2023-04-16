import {
  clientStore,
  editor,
  space,
  system,
} from "$sb/silverbullet-syscall/mod.js";

import { asset } from "$sb/plugos-syscall/mod.js";
import { parseMarkdown } from "../../plug-api/silverbullet-syscall/markdown.js";
import { renderMarkdownToHtml } from "./markdown_render.js";
export async function updateMarkdownPreview() {
  if (!(await clientStore.get("enableMarkdownPreview"))) {
    return;
  }
  const text = await editor.getText();
  const mdTree = await parseMarkdown(text);
  const css = await asset.readAsset("assets/styles.css");
  const js = await asset.readAsset("assets/handler.js");
  const html = await renderMarkdownToHtml(mdTree, {
    smartHardBreak: true,
    annotationPositions: true,
    renderFrontMatter: true,
    inlineAttachments: async (url) => {
      if (!url.includes("://")) {
        try {
          return await space.readAttachment(url);
        } catch (e) {
          console.error(e);
          return url;
        }
      }
      return url;
    },
  });
  await editor.showPanel(
    "rhs",
    2,
    `<html><head><style>${css}</style></head><body><div id="root">${html}</div></body></html>`,
    js
  );
}
export async function previewClickHandler(e) {
  const [eventName, arg] = JSON.parse(e);
  switch (eventName) {
    case "pos":
      await editor.moveCursor(+arg, true);
      break;
    case "command":
      await system.invokeCommand(arg);
      break;
  }
}
