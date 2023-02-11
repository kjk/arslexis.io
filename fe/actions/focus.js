/**
 * @param {HTMLElement} node
 */
export function focus(node) {
  node.focus();
}

/**
 * @param {HTMLElement} node
 */
export function delayedFocus(node, delay = 100) {
  // note: not sure why I need this but e.g. if I have CodeMirror,
  // the codemirror element regains focus if I set my focus
  // immediately on mount. Delay of 100 seems to fix it (50 was too low)
  // is it just with codemirror or more general?
  setTimeout(() => node.focus(), delay);
}
