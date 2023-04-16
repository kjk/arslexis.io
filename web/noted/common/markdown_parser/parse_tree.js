export function lezerToParseTree(text, n, offset = 0) {
  let children = [];
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
        text: text.substring(n.from, n.to)
      }
    ];
  } else {
    const newChildren = [];
    let index = n.from;
    for (const child2 of children) {
      const s2 = text.substring(index, child2.from);
      if (s2) {
        newChildren.push({
          from: index + offset,
          to: child2.from + offset,
          text: s2
        });
      }
      newChildren.push(child2);
      index = child2.to;
    }
    const s = text.substring(index, n.to);
    if (s) {
      newChildren.push({ from: index + offset, to: n.to + offset, text: s });
    }
    children = newChildren;
  }
  const result = {
    type: n.name,
    from: n.from + offset,
    to: n.to + offset
  };
  if (children.length > 0) {
    result.children = children;
  }
  if (nodeText) {
    result.text = nodeText;
  }
  return result;
}
export function parse(language, text) {
  text = text.replaceAll("\r", "");
  const tree = lezerToParseTree(text, language.parser.parse(text).topNode);
  return tree;
}
