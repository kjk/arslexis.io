/* CodeMirror utilities */

/**
 * try real hard to put focus in EditorView
 * @param {import("@codemirror/view").EditorView} editorView
 */
export function focusEditorView(editorView) {
  if (!editorView || editorView.hasFocus) {
    return;
  }
  let max = 10; // limit to 1 sec
  const timer = setInterval(() => {
    editorView.focus();
    max -= 1;
    if (editorView.hasFocus || max < 0) clearInterval(timer);
  }, 100);
}
