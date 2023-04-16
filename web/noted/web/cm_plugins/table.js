import { Decoration, WidgetType, syntaxTree } from "../deps.js";
import {
  decoratorStateField,
  invisibleDecoration,
  isCursorInRange,
} from "./util.js";

import { lezerToParseTree } from "../../common/markdown_parser/parse_tree.js";
import { renderMarkdownToHtml } from "../../plugs/markdown/markdown_render.js";

class TableViewWidget extends WidgetType {
  constructor(pos, editor, t) {
    super();
    this.pos = pos;
    this.editor = editor;
    this.t = t;
  }
  toDOM() {
    const dom = document.createElement("span");
    dom.classList.add("sb-table-widget");
    dom.addEventListener("click", (e) => {
      const dataAttributes = e.target.dataset;
      this.editor.editorView.dispatch({
        selection: {
          anchor: dataAttributes.pos ? +dataAttributes.pos : this.pos,
        },
      });
    });
    renderMarkdownToHtml(this.t, {
      annotationPositions: true,
      inlineAttachments: async (url) => {
        if (!url.includes("://")) {
          try {
            const d = await this.editor.space.readAttachment(url, "dataurl");
            return d.data;
          } catch (e) {
            console.error(e);
            return url;
          }
        }
        return url;
      },
    }).then((html) => {
      dom.innerHTML = html;
    });
    return dom;
  }
}
export function tablePlugin(editor) {
  return decoratorStateField((state) => {
    const widgets = [];
    syntaxTree(state).iterate({
      enter: (node) => {
        const { from, to, name } = node;
        if (name !== "Table") return;
        if (isCursorInRange(state, [from, to])) return;
        const tableText = state.sliceDoc(from, to);
        const lineStrings = tableText.split("\n");
        const lines = [];
        let fromIt = from;
        for (const line of lineStrings) {
          lines.push({
            from: fromIt,
            to: fromIt + line.length,
          });
          fromIt += line.length + 1;
        }
        const firstLine = lines[0],
          lastLine = lines[lines.length - 1];
        if (!firstLine || !lastLine) return;
        widgets.push(invisibleDecoration.range(firstLine.from, firstLine.to));
        widgets.push(invisibleDecoration.range(lastLine.from, lastLine.to));
        lines.slice(1, lines.length - 1).forEach((line) => {
          widgets.push(
            Decoration.line({ class: "sb-line-table-outside" }).range(line.from)
          );
        });
        const text = state.sliceDoc(0, to);
        widgets.push(
          Decoration.widget({
            widget: new TableViewWidget(
              from,
              editor,
              lezerToParseTree(text, node.node)
            ),
          }).range(from)
        );
      },
    });
    return Decoration.set(widgets, true);
  });
}
