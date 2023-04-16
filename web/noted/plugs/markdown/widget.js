import { parseMarkdown } from "$sb/silverbullet-syscall/markdown.js";
import { renderMarkdownToHtml } from "./markdown_render.js";
export async function markdownWidget(bodyText) {
  const mdTree = await parseMarkdown(bodyText);
  const html = await renderMarkdownToHtml(mdTree, {
    smartHardBreak: true,
  });
  return Promise.resolve({
    html,
    script: `updateHeight();
    document.addEventListener("click", () => {
      api({type: "blur"});
    });`,
  });
}
