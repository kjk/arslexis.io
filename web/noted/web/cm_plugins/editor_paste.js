import { EditorView, ViewPlugin } from "../deps.js";
import {
  tables,
  taskListItems,
} from "https://cdn.skypack.dev/@joplin/turndown-plugin-gfm@1.0.45";

import TurndownService from "https://cdn.skypack.dev/turndown@7.1.1";
import { maximumAttachmentSize } from "../../common/types.js";
import { safeRun } from "../../plugos/util.js";

const turndownService = new TurndownService({
  hr: "---",
  codeBlockStyle: "fenced",
  headingStyle: "atx",
  emDelimiter: "*",
  bulletListMarker: "*",
  strongDelimiter: "**",
  linkStyle: "inlined",
});
turndownService.use(taskListItems);
turndownService.use(tables);
function striptHtmlComments(s) {
  return s.replace(/<!--[\s\S]*?-->/g, "");
}
const urlRegexp =
  /^https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
export const pasteLinkExtension = ViewPlugin.fromClass(
  class {
    update(update) {
      update.transactions.forEach((tr) => {
        if (tr.isUserEvent("input.paste")) {
          const pastedText = [];
          let from = 0;
          let to = 0;
          tr.changes.iterChanges((fromA, _toA, _fromB, toB, inserted) => {
            pastedText.push(inserted.sliceString(0));
            from = fromA;
            to = toB;
          });
          const pastedString = pastedText.join("");
          if (pastedString.match(urlRegexp)) {
            const selection = update.startState.selection.main;
            if (!selection.empty) {
              setTimeout(() => {
                update.view.dispatch({
                  changes: [
                    {
                      from,
                      to,
                      insert: `[${update.startState.sliceDoc(
                        selection.from,
                        selection.to
                      )}](${pastedString})`,
                    },
                  ],
                });
              });
            }
          }
        }
      });
    }
  }
);
export function attachmentExtension(editor) {
  let shiftDown = false;
  return EditorView.domEventHandlers({
    dragover: (event) => {
      event.preventDefault();
    },
    keydown: (event) => {
      if (event.key === "Shift") {
        shiftDown = true;
      }
      return false;
    },
    keyup: (event) => {
      if (event.key === "Shift") {
        shiftDown = false;
      }
      return false;
    },
    drop: (event) => {
      if (event.dataTransfer) {
        const payload = [...event.dataTransfer.files];
        if (!payload.length) {
          return;
        }
        safeRun(async () => {
          await processFileTransfer(payload);
        });
      }
    },
    paste: (event) => {
      const payload = [...event.clipboardData.items];
      const richText = event.clipboardData?.getData("text/html");
      if (richText && !shiftDown) {
        const markdown = striptHtmlComments(
          turndownService.turndown(richText)
        ).trim();
        const view = editor.editorView;
        const selection = view.state.selection.main;
        view.dispatch({
          changes: [
            {
              from: selection.from,
              to: selection.to,
              insert: markdown,
            },
          ],
          selection: {
            anchor: selection.from + markdown.length,
          },
          scrollIntoView: true,
        });
        return true;
      }
      if (!payload.length || payload.length === 0) {
        return false;
      }
      safeRun(async () => {
        await processItemTransfer(payload);
      });
    },
  });
  async function processFileTransfer(payload) {
    const data = await payload[0].arrayBuffer();
    await saveFile(data, payload[0].name, payload[0].type);
  }
  async function processItemTransfer(payload) {
    const file = payload.find((item) => item.kind === "file");
    if (!file) {
      return false;
    }
    const fileType = file.type;
    const ext = fileType.split("/")[1];
    const fileName = new Date()
      .toISOString()
      .split(".")[0]
      .replace("T", "_")
      .replaceAll(":", "-");
    const data = await file.getAsFile()?.arrayBuffer();
    await saveFile(data, `${fileName}.${ext}`, fileType);
  }
  async function saveFile(data, suggestedName, mimeType) {
    if (data.byteLength > maximumAttachmentSize) {
      editor.flashNotification(
        `Attachment is too large, maximum is ${
          maximumAttachmentSize / 1024 / 1024
        }MB`,
        "error"
      );
      return;
    }
    const finalFileName = await editor.prompt(
      "File name for pasted attachment",
      suggestedName
    );
    if (!finalFileName) {
      return;
    }
    await editor.space.writeAttachment(finalFileName, "arraybuffer", data);
    let attachmentMarkdown = `[${finalFileName}](${encodeURIComponent(
      finalFileName
    )})`;
    if (mimeType.startsWith("image/")) {
      attachmentMarkdown = `![](${encodeURIComponent(finalFileName)})`;
    }
    editor.editorView.dispatch({
      changes: [
        {
          insert: attachmentMarkdown,
          from: editor.editorView.state.selection.main.from,
        },
      ],
    });
  }
}
