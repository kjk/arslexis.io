// TODO: replace type with a number?

/** @typedef {Object} ParseTree
 * @property {string} [type]
 * @property {number} [from]
 * @property {number} [to]
 * @property {string} [text]
 * @property {ParseTree[]} [children]
 * @property {ParseTree} [parent]
 */

/**
 * @param {ParseTree} tree
 */
export function addParentPointers(tree) {
  if (!tree.children) {
    return;
  }
  for (const child of tree.children) {
    if (child.parent) {
      // Already added parent pointers before
      return;
    }
    child.parent = tree;
    addParentPointers(child);
  }
}

/**
 * @param {ParseTree} tree
 */
export function removeParentPointers(tree) {
  delete tree.parent;
  if (!tree.children) {
    return;
  }
  for (const child of tree.children) {
    removeParentPointers(child);
  }
}

/**
 * @param {ParseTree} tree
 * @param {(ParseTree) => boolean} matchFn
 * @returns {ParseTree}
 */
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

/**
 * @param {ParseTree} tree
 * @param {string} nodeType
 * @returns {ParseTree[]}
 */
export function collectNodesOfType(tree, nodeType) {
  return collectNodesMatching(tree, (n) => n.type === nodeType);
}

/**
 * TODO: could this use yield?
 * @param {ParseTree} tree
 * @param {(ParseTree) => boolean} matchFn
 * @returns {ParseTree[]}
 */
export function collectNodesMatching(tree, matchFn) {
  if (matchFn(tree)) {
    return [tree];
  }
  /** @type {ParseTree[]} */
  let results = [];
  if (tree.children) {
    for (const child of tree.children) {
      // TODO: concat? pass results as an argument?
      results = [...results, ...collectNodesMatching(child, matchFn)];
    }
  }
  return results;
}

/**
 * return value: returning undefined = not matched, continue, null = delete, new node = replace
 * @param {ParseTree} tree
 * @param {(ParseTree) => ParseTree | null | undefined} substituteFn
 */
export function replaceNodesMatching(tree, substituteFn) {
  if (tree.children) {
    const children = tree.children.slice();
    for (const child of children) {
      const subst = substituteFn(child);
      if (subst !== undefined) {
        const pos = tree.children.indexOf(child);
        if (subst) {
          tree.children.splice(pos, 1, subst);
        } else {
          // null = delete
          tree.children.splice(pos, 1);
        }
      } else {
        replaceNodesMatching(child, substituteFn);
      }
    }
  }
}

/**
 * @param {ParseTree} tree
 * @param {(ParseTree) => boolean} matchFn
 * @returns {ParseTree | null}
 */
export function findNodeMatching(tree, matchFn) {
  return collectNodesMatching(tree, matchFn)[0];
}

/**
 * @param {ParseTree} tree
 * @param {string} nodeType
 * @returns {ParseTree | null}
 */
export function findNodeOfType(tree, nodeType) {
  return collectNodesMatching(tree, (n) => n.type === nodeType)[0];
}

/**
 * @param {ParseTree} tree
  // Return value = should stop traversal?
 * @param {(ParseTree) => boolean} matchFn
 */
export function traverseTree(tree, matchFn) {
  // Do a collect, but ignore the result
  collectNodesMatching(tree, matchFn);
}

/**
 * Finds non-text node at position
 * @param {ParseTree} tree
 * @param {number} pos
 * @returns {ParseTree | null}
 */
export function nodeAtPos(tree, pos) {
  if (pos < tree.from || pos >= tree.to) {
    return null;
  }
  if (!tree.children) {
    return tree;
  }
  for (const child of tree.children) {
    const n = nodeAtPos(child, pos);
    if (n && n.text !== undefined) {
      // Got a text node, let's return its parent
      return tree;
    } else if (n) {
      // Got it
      return n;
    }
  }
  return null;
}

/**
 * Turn ParseTree back into text
 * @param {ParseTree} tree
 * @returns {string}
 */
export function renderToText(tree) {
  /** @type {string[]} */
  const pieces = [];
  if (tree.text !== undefined) {
    return tree.text;
  }
  for (const child of tree.children) {
    pieces.push(renderToText(child));
  }
  return pieces.join("");
}

/**
 * @param {ParseTree} tree
 * @returns {ParseTree}
 */
export function cloneTree(tree) {
  const newTree = { ...tree };
  if (tree.children) {
    newTree.children = tree.children.map(cloneTree);
  }
  delete newTree.parent;
  return newTree;
}
