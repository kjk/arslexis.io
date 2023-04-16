import { EditorState } from "../deps.js";
export function readonlyMode() {
  return EditorState.changeFilter.of((tr) => {
    return !tr.docChanged;
  });
}
