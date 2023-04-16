import { syntaxTree } from "../deps.js";
const straightQuoteContexts = [
  "CommentBlock",
  "FencedCode",
  "InlineCode",
  "FrontMatterCode",
  "DirectiveStart",
];
function keyBindingForQuote(quote, left, right) {
  return {
    any: (target, event) => {
      if (event.key !== quote) {
        return false;
      }
      const cursorPos = target.state.selection.main.from;
      const chBefore = target.state.sliceDoc(cursorPos - 1, cursorPos);
      let node = syntaxTree(target.state).resolveInner(cursorPos);
      while (node) {
        if (straightQuoteContexts.includes(node.type.name)) {
          return false;
        }
        if (node.parent) {
          node = node.parent;
        } else {
          break;
        }
      }
      let q = right;
      if (/\W/.exec(chBefore) && !/[!\?,\.\-=“]/.exec(chBefore)) {
        q = left;
      }
      target.dispatch({
        changes: {
          insert: q,
          from: cursorPos,
        },
        selection: {
          anchor: cursorPos + 1,
        },
      });
      return true;
    },
  };
}
export const smartQuoteKeymap = [
  keyBindingForQuote('"', "\u201C", "\u201D"),
  keyBindingForQuote("'", "\u2018", "\u2019"),
];
