import { blockquotePlugin } from "./block_quote.ts";
import { admonitionPlugin } from "./admonition.ts";
import { directivePlugin } from "./directive.ts";
import { hideHeaderMarkPlugin, hideMarksPlugin } from "./hide_mark.ts";
import { cleanBlockPlugin } from "./block.ts";
import { linkPlugin } from "./link.ts";
import { listBulletPlugin } from "./list.ts";
import { tablePlugin } from "./table.ts";
import { taskListPlugin } from "./task.ts";
import { cleanWikiLinkPlugin } from "./wiki_link.ts";
import { cleanCommandLinkPlugin } from "./command_link.ts";
import { fencedCodePlugin } from "./fenced_code.ts";
export function cleanModePlugins(editor) {
  return [
    linkPlugin(editor),
    directivePlugin(),
    blockquotePlugin(),
    admonitionPlugin(editor),
    hideMarksPlugin(),
    hideHeaderMarkPlugin(),
    cleanBlockPlugin(),
    fencedCodePlugin(editor),
    taskListPlugin({
      onCheckboxClick: (pos) => {
        const clickEvent = {
          page: editor.currentPage,
          altKey: false,
          ctrlKey: false,
          metaKey: false,
          pos
        };
        editor.dispatchAppEvent("page:click", clickEvent);
      }
    }),
    listBulletPlugin(),
    tablePlugin(editor),
    cleanWikiLinkPlugin(editor),
    cleanCommandLinkPlugin(editor)
  ];
}
