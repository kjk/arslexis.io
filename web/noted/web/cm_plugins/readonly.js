import { EditorState } from "../deps.ts";
export function readonlyMode() {
  return EditorState.changeFilter.of((tr) => {
    return !tr.docChanged;
  });
}
