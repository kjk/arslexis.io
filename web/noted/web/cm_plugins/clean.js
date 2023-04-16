import { hideHeaderMarkPlugin, hideMarksPlugin } from "./hide_mark.js";

import { admonitionPlugin } from "./admonition.js";
import { blockquotePlugin } from "./block_quote.js";
import { cleanBlockPlugin } from "./block.js";
import { cleanCommandLinkPlugin } from "./command_link.js";
import { cleanWikiLinkPlugin } from "./wiki_link.js";
import { directivePlugin } from "./directive.js";
import { fencedCodePlugin } from "./fenced_code.js";
import { linkPlugin } from "./link.js";
import { listBulletPlugin } from "./list.js";
import { tablePlugin } from "./table.js";
import { taskListPlugin } from "./task.js";
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
          pos,
        };
        editor.dispatchAppEvent("page:click", clickEvent);
      },
    }),
    listBulletPlugin(),
    tablePlugin(editor),
    cleanWikiLinkPlugin(editor),
    cleanCommandLinkPlugin(editor),
  ];
}
