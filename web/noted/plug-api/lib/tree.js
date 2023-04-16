export function addParentPointers(tree) {
  if (!tree.children) {
    return;
  }
  for (const child of tree.children) {
    if (child.parent) {
      return;
    }
    child.parent = tree;
    addParentPointers(child);
  }
}
export function removeParentPointers(tree) {
  delete tree.parent;
  if (!tree.children) {
    return;
  }
  for (const child of tree.children) {
    removeParentPointers(child);
  }
}
export function findParentMatching(tree, matchFn) {
  let node = tree.parent;
  while (node) {
    if (matchFn(node)) {
      return node;
    }
    node = node.parent;
  }
  return null;
}
export function collectNodesOfType(tree, nodeType) {
  return collectNodesMatching(tree, (n) => n.type === nodeType);
}
export function collectNodesMatching(tree, matchFn) {
  if (matchFn(tree)) {
    return [tree];
  }
  let results = [];
  if (tree.children) {
    for (const child of tree.children) {
      results = [...results, ...collectNodesMatching(child, matchFn)];
    }
  }
  return results;
}
export function replaceNodesMatching(tree, substituteFn) {
  if (tree.children) {
    const children = tree.children.slice();
    for (const child of children) {
      const subst = substituteFn(child);
      if (subst !== void 0) {
        const pos = tree.children.indexOf(child);
        if (subst) {
          tree.children.splice(pos, 1, subst);
        } else {
          tree.children.splice(pos, 1);
        }
      } else {
        replaceNodesMatching(child, substituteFn);
      }
    }
  }
}
export function findNodeMatching(tree, matchFn) {
  return collectNodesMatching(tree, matchFn)[0];
}
export function findNodeOfType(tree, nodeType) {
  return collectNodesMatching(tree, (n) => n.type === nodeType)[0];
}
export function traverseTree(tree, matchFn) {
  collectNodesMatching(tree, matchFn);
}
export function nodeAtPos(tree, pos) {
  if (pos < tree.from || pos >= tree.to) {
    return null;
  }
  if (!tree.children) {
    return tree;
  }
  for (const child of tree.children) {
    const n = nodeAtPos(child, pos);
    if (n && n.text !== void 0) {
      return tree;
    } else if (n) {
      return n;
    }
  }
  return null;
}
export function renderToText(tree) {
  const pieces = [];
  if (tree.text !== void 0) {
    return tree.text;
  }
  for (const child of tree.children) {
    pieces.push(renderToText(child));
  }
  return pieces.join("");
}
export function cloneTree(tree) {
  const newTree = { ...tree };
  if (tree.children) {
    newTree.children = tree.children.map(cloneTree);
  }
  delete newTree.parent;
  return newTree;
}
