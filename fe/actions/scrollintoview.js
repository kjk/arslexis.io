export function scrollintoview(node) {
  // TODO: test on Safari
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
  node.scrollIntoView(false);
}
