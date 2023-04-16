import { Decoration, syntaxTree } from "../deps.js";
import {
  decoratorStateField,
  invisibleDecoration,
  isCursorInRange,
} from "./util.js";
export function linkPlugin(editor) {
  return decoratorStateField((state) => {
    const widgets = [];
    syntaxTree(state).iterate({
      enter: ({ type, from, to }) => {
        if (type.name !== "Link") {
          return;
        }
        if (isCursorInRange(state, [from, to])) {
          return;
        }
        const text = state.sliceDoc(from, to);
        const [anchorPart, linkPart] = text.split("](");
        if (anchorPart.substring(1).trim() === "") {
          return;
        }
        if (!linkPart) {
          return;
        }
        const cleanAnchor = anchorPart.substring(1);
        const cleanLink = linkPart.substring(0, linkPart.length - 1);
        widgets.push(invisibleDecoration.range(from, from + 1));
        widgets.push(
          Decoration.mark({
            tagName: "a",
            class: "sb-link",
            attributes: {
              href: cleanLink,
              title: `Click to visit ${cleanLink}`,
            },
          }).range(from + 1, from + cleanAnchor.length + 1)
        );
        widgets.push(
          invisibleDecoration.range(from + cleanAnchor.length + 1, to)
        );
      },
    });
    return Decoration.set(widgets, true);
  });
}
