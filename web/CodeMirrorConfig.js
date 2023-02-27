import { EditorState, Compartment } from "@codemirror/state";

/** @typedef {import("@codemirror/view").EditorView}EditorView */

export class CodeMirrorConfig {
  /** @type {EditorView} */
  editorView;

  constructor(editorView) {
    this.editorView = editorView;
  }

  readOnlyCompartment;
  /**
   * @param {boolean} readOnly
   */
  makeReadOnly(readOnly) {
    this.readOnlyCompartment = new Compartment();
    const v = EditorState.readOnly.of(readOnly);
    return this.readOnlyCompartment.of(v);
  }

  /**
   * @param {boolean} readOnly
   */
  updateReadOnly(readOnly) {
    const v = EditorState.readOnly.of(readOnly);
    this.editorView.dispatch({
      effects: this.readOnlyCompartment.reconfigure(v),
    });
  }
}
