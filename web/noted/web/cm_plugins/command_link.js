import { commandLinkRegex } from "../../common/markdown_parser/parser.ts";
import { Decoration, syntaxTree } from "../deps.ts";
import {
  ButtonWidget,
  decoratorStateField,
  invisibleDecoration,
  isCursorInRange
} from "./util.ts";
export function cleanCommandLinkPlugin(editor) {
  return decoratorStateField((state) => {
    const widgets = [];
    syntaxTree(state).iterate({
      enter: ({ type, from, to }) => {
        if (type.name !== "CommandLink") {
          return;
        }
        if (isCursorInRange(state, [from, to])) {
          return;
        }
        const text = state.sliceDoc(from, to);
        const match = commandLinkRegex.exec(text);
        if (!match)
          return;
        const [_fullMatch, command, _pipePart, alias] = match;
        widgets.push(
          invisibleDecoration.range(
            from,
            to
          )
        );
        const linkText = alias || command;
        widgets.push(
          Decoration.widget({
            widget: new ButtonWidget(
              linkText,
              `Run command: ${command}`,
              "sb-command-button",
              (e) => {
                if (e.altKey) {
                  return editor.editorView.dispatch({
                    selection: { anchor: from + 2 }
                  });
                }
                const clickEvent = {
                  page: editor.currentPage,
                  ctrlKey: e.ctrlKey,
                  metaKey: e.metaKey,
                  altKey: e.altKey,
                  pos: from
                };
                editor.dispatchAppEvent("page:click", clickEvent).catch(
                  console.error
                );
              }
            )
          }).range(from)
        );
      }
    });
    return Decoration.set(widgets, true);
  });
}
