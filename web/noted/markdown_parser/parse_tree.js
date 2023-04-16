/** @typedef {import("../lib/tree").ParseTree} ParseTree */
/** @typedef {import("@lezer/common").SyntaxNode} SyntaxNode */
/** @typedef {import("@codemirror/language").Language} Language */

/**
 * @param {string} text
 * @param {SyntaxNode} n
 * @returns {ParseTree}
 */
export function lezerToParseTree(text, n, offset = 0) {
  /** @type {ParseTree[]} */
  let children = [];
  /** @type {string | undefined} */
  let nodeText;
  let child = n.firstChild;
  while (child) {
    children.push(lezerToParseTree(text, child));
    child = child.nextSibling;
  }

  if (children.length === 0) {
    children = [
      {
        from: n.from + offset,
        to: n.to + offset,
        text: text.substring(n.from, n.to),
      },
    ];
  } else {
    /** @type {ParseTree[]} */
    const newChildren = [];
    let index = n.from;
    for (const child of children) {
      const s = text.substring(index, child.from);
      if (s) {
        newChildren.push({
          from: index + offset,
          to: child.from + offset,
          text: s,
        });
      }
      newChildren.push(child);
      index = child.to;
    }
    const s = text.substring(index, n.to);
    if (s) {
      newChildren.push({ from: index + offset, to: n.to + offset, text: s });
    }
    children = newChildren;
  }

  /** @type {ParseTree} */
  const result = {
    type: n.name,
    from: n.from + offset,
    to: n.to + offset,
  };
  if (children.length > 0) {
    result.children = children;
  }
  if (nodeText) {
    result.text = nodeText;
  }
  return result;
}

/**
 *
 * @param {Language} language
 * @param {string} text
 * @returns {ParseTree}
 */
export function parse(language, text) {
  // Remove \r for Windows before parsing
  text = text.replaceAll("\r", "");
  const tree = lezerToParseTree(text, language.parser.parse(text).topNode);
  return tree;
}
