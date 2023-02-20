import { EditorState, EditorSelection } from "@codemirror/state";

export function mkState(doc, extensions = []) {
  let range = /\||<([^]*?)>/g,
    m;
  let ranges = [];
  while ((m = range.exec(doc))) {
    if (m[1]) {
      ranges.push(EditorSelection.range(m.index, m.index + m[1].length));
      doc =
        doc.slice(0, m.index) +
        doc.slice(m.index + 1, m.index + 1 + m[1].length) +
        doc.slice(m.index + m[0].length);
      range.lastIndex -= 2;
    } else {
      ranges.push(EditorSelection.cursor(m.index));
      doc = doc.slice(0, m.index) + doc.slice(m.index + 1);
      range.lastIndex--;
    }
  }
  return EditorState.create({
    doc,
    selection: ranges.length ? EditorSelection.create(ranges) : undefined,
    extensions: [extensions, EditorState.allowMultipleSelections.of(true)],
  });
}

export function stateStr(state) {
  let doc = state.doc.toString();
  for (let i = state.selection.ranges.length - 1; i >= 0; i--) {
    let range = state.selection.ranges[i];
    if (range.empty)
      doc = doc.slice(0, range.from) + "|" + doc.slice(range.from);
    else
      doc =
        doc.slice(0, range.from) +
        "<" +
        doc.slice(range.from, range.to) +
        ">" +
        doc.slice(range.to);
  }
  return doc;
}

export function cmd(state, command) {
  command({
    state,
    dispatch(tr) {
      state = tr.state;
    },
  });
  return state;
}

export function cmd2(state, command, arg1, arg2) {
  command(
    {
      state,
      dispatch(tr) {
        state = tr.state;
      },
    },
    arg1,
    arg2
  );
  return state;
}

export function runCmd(from, command, exts = []) {
  let state = mkState(from, exts);
  return stateStr(cmd(state, command));
}

export function runCmd2(from, command, arg1, arg2, exts = []) {
  let state = mkState(from, exts);
  return stateStr(cmd2(state, command, arg1, arg2));
}
