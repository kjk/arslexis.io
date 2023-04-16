import { Decoration, syntaxTree } from "../deps.ts";
import { decoratorStateField } from "./util.ts";
export function lineWrapper(wrapElements) {
  return decoratorStateField((state) => {
    const widgets = [];
    const elementStack = [];
    const doc = state.doc;
    syntaxTree(state).iterate({
      enter: ({ type, from, to }) => {
        for (const wrapElement of wrapElements) {
          if (type.name == wrapElement.selector) {
            if (wrapElement.nesting) {
              elementStack.push(type.name);
            }
            const bodyText = doc.sliceString(from, to);
            let idx = from;
            for (const line of bodyText.split("\n")) {
              let cls = wrapElement.class;
              if (wrapElement.nesting) {
                cls = `${cls} ${cls}-${elementStack.length}`;
              }
              widgets.push(
                Decoration.line({
                  class: cls
                }).range(doc.lineAt(idx).from)
              );
              idx += line.length + 1;
            }
          }
        }
      },
      leave({ type }) {
        for (const wrapElement of wrapElements) {
          if (type.name == wrapElement.selector && wrapElement.nesting) {
            elementStack.pop();
          }
        }
      }
    });
    return Decoration.set(widgets, true);
  });
}
