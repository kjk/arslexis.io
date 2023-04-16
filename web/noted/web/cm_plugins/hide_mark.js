import { Decoration, syntaxTree } from "../deps.js";
import {
  checkRangeOverlap,
  decoratorStateField,
  invisibleDecoration,
  isCursorInRange,
} from "./util.js";
const typesWithMarks = [
  "Emphasis",
  "StrongEmphasis",
  "InlineCode",
  "Highlight",
  "Strikethrough",
];
const markTypes = [
  "EmphasisMark",
  "CodeMark",
  "HighlightMark",
  "StrikethroughMark",
];
export function hideMarksPlugin() {
  return decoratorStateField((state) => {
    const widgets = [];
    let parentRange;
    syntaxTree(state).iterate({
      enter: ({ type, from, to, node }) => {
        if (typesWithMarks.includes(type.name)) {
          if (parentRange && checkRangeOverlap([from, to], parentRange)) {
            return;
          } else parentRange = [from, to];
          if (isCursorInRange(state, [from, to])) return;
          const innerTree = node.toTree();
          innerTree.iterate({
            enter({ type: type2, from: markFrom, to: markTo }) {
              if (!markTypes.includes(type2.name)) return;
              widgets.push(
                invisibleDecoration.range(from + markFrom, from + markTo)
              );
            },
          });
        }
      },
    });
    return Decoration.set(widgets, true);
  });
}
export function hideHeaderMarkPlugin() {
  return decoratorStateField((state) => {
    const widgets = [];
    syntaxTree(state).iterate({
      enter: ({ type, from, to }) => {
        if (!type.name.startsWith("ATXHeading")) {
          return;
        }
        const line = state.sliceDoc(from, to);
        if (isCursorInRange(state, [from, to])) {
          widgets.push(
            Decoration.line({ class: "sb-header-inside" }).range(from)
          );
          return;
        }
        const spacePos = line.indexOf(" ");
        if (spacePos === -1) {
          return;
        }
        widgets.push(invisibleDecoration.range(from, from + spacePos + 1));
      },
    });
    return Decoration.set(widgets, true);
  });
}
