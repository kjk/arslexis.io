import { Decoration, syntaxTree } from "../deps.ts";
import {
  decoratorStateField,
  invisibleDecoration,
  isCursorInRange
} from "./util.ts";
function decorateBlockQuote(state) {
  const widgets = [];
  syntaxTree(state).iterate({
    enter: ({ type, from, to }) => {
      if (isCursorInRange(state, [from, to]))
        return;
      if (type.name === "QuoteMark") {
        widgets.push(invisibleDecoration.range(from, to));
        widgets.push(
          Decoration.line({ class: "sb-blockquote-outside" }).range(from)
        );
      }
    }
  });
  return Decoration.set(widgets, true);
}
export function blockquotePlugin() {
  return decoratorStateField(decorateBlockQuote);
}
