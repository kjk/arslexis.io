type EditorState = import("@codemirror/state").EditorState;
type EditorView = import("@codemirror/view").EditorView;
type TextIterator = import("@codemirror/state").TextIterator;

import {
  b64Decode,
  b64DecodeAsHex,
  b64EncodeHtmlImage,
  b64EncodeStandard,
  b64EncodeURLSafe,
  strCompressWS,
  urlDecode,
  urlEncode,
} from "./strutil";
import { foldAll, unfoldAll } from "@codemirror/language";
import { EditorSelection } from "@codemirror/state";
import { getClipboard, len, setClipboard, throwIf } from "./util";

function isEmptySelection(sel: EditorSelection): boolean {
  if (len(sel.ranges) > 1) {
    return false;
  }
  return sel.ranges[0].empty;
}

function runOnSelIter({ state, dispatch }: {state: EditorState, dispatch: Function}, fn: Function, userEvent: string): boolean {
  if (state.readOnly) return false;
  const changes = [];
  const doc = state.doc;
  const sel = state.selection;
  if (isEmptySelection(sel)) {
    return false;
  }
  for (const range of sel.ranges) {
    const { from, to } = range;
    fn(doc.iterRange(from, to), changes, from);
  }
  if (!changes.length) return false;
  dispatch(state.update({ changes, userEvent }));
  return true;
}

function runOnIter({ state, dispatch }: {state: EditorState, dispatch: Function}, fn: Function, userEvent: string): boolean {
  if (state.readOnly) return false;
  const changes = [];
  const doc = state.doc;
  const sel = state.selection;
  if (isEmptySelection(sel)) {
    fn(doc.iter(), changes);
  } else {
    for (const range of sel.ranges) {
      const { from, to } = range;
      fn(doc.iterRange(from, to), changes, from);
    }
  }
  if (!changes.length) return false;
  dispatch(state.update({ changes, userEvent }));
  return true;
}

// perf: returning global value because is faster than allocating result many times
// perf bench: https://t.co/RthoIWXE2o

// iterates content of lines, skipping newline characaters
// for each element returns [pos, line string]
export function* iterLines(iter: TextIterator): any {
  let pos = 0;
  const res = [0, "", ""];
  res[0] = 0;
  res[1] = "";
  while (true) {
    iter.next();
    if (iter.done) {
      res[2] = "";
      yield res;
      return;
    }
    if (iter.lineBreak) {
      res[2] = iter.value;
      yield res;
      pos += len(iter.value);
      res[0] = pos;
      res[1] = "";
    } else {
      // delay emiting line to next lineBreak or done
      res[0] = pos;
      res[1] = iter.value;
      pos += len(iter.value);
    }
  }
}

const rxLeadingWS = /^\s+/;
export function deleteLeadingWhitespace({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  function iter(iter: TextIterator, changes: any[], start: number = 0) {
    for (const li of iterLines(iter)) {
      const s = li[1];
      const m = s.match(rxLeadingWS);
      if (m != null) {
        const n = m[0].length;
        const from = li[0] + start;
        const to = from + n;
        changes.push({ from, to });
      }
    }
  }
  return runOnIter({ state, dispatch }, iter, "delete.leadingwhitespace");
}

const rxTrailingWS = /\s+$/;
export function deleteTrailingWhitespace({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  function iter(iter: TextIterator, changes: any[], start: number = 0) {
    for (const li of iterLines(iter)) {
      const s = li[1];
      const m = s.match(rxTrailingWS);
      if (m != null) {
        const n = m[0].length;
        const from = start + li[0] + len(s) - n;
        const to = from + n;
        changes.push({ from, to });
      }
    }
  }
  return runOnIter({ state, dispatch }, iter, "delete.trailinghitespace");
}

export function deleteFirstChar({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  function iter(iter: TextIterator, changes: any[], start: number = 0) {
    for (const li of iterLines(iter)) {
      const s = li[1];
      if (len(s) > 0) {
        const from = start + li[0];
        const to = from + 1;
        changes.push({ from, to });
      }
    }
  }
  return runOnSelIter({ state, dispatch }, iter, "delete.firstchar");
}

export function deleteLastChar({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  function iter(iter: TextIterator, changes: any[], start: number = 0) {
    for (const li of iterLines(iter)) {
      const s = li[1];
      if (len(s) > 0) {
        const from = start + li[0] + len(s) - 1;
        const to = from + 1;
        changes.push({ from, to });
      }
    }
  }
  return runOnSelIter({ state, dispatch }, iter, "delete.lastchar");
}

export function duplicateSelection({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  if (state.readOnly) return false;
  let changes = [];
  let doc = state.doc;
  let sel = state.selection;
  for (let range of sel.ranges) {
    if (range.empty) {
      continue;
    }
    let s = doc.slice(range.from, range.to);
    let from = range.to;
    let insert = s;
    changes.push({ from, insert });
  }
  if (!changes.length) return false;
  dispatch(state.update({ changes, userEvent: "input.duplicateselection" }));
  return true;
}

export function mergeBlankLines({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  function iter(iter: TextIterator, changes: any[], start: number = 0) {
    let prevWasBlank = false;
    for (let li of iterLines(iter)) {
      let s = li[1];
      if (len(s) === 0) {
        if (prevWasBlank) {
          let from = start + li[0];
          let to = from + len(li[2]);
          changes.push({ from, to });
        }
        prevWasBlank = true;
      } else {
        prevWasBlank = false;
      }
    }
  }
  return runOnIter({ state, dispatch }, iter, "delete.mergeblanklines");
}

export function removeBlankLines({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  function iter(iter: TextIterator, changes: any[], start: number = 0) {
    for (const li of iterLines(iter)) {
      const s = li[1];
      if (len(s) === 0) {
        const from = start + li[0];
        const to = from + len(li[2]);
        changes.push({ from, to });
      }
    }
  }
  return runOnIter({ state, dispatch }, iter, "delete.removeblanklines");
}

export function encloseSelection({ state, dispatch }: {state: EditorState, dispatch: Function}, before: string, after: string): boolean {
  if (state.readOnly) return false;
  const changes = [];
  const sel = state.selection;

  // TOOD: if empty selection, set selection to after befor
  for (let { from, to } of sel.ranges) {
    let insert = before;
    if (len(insert) > 0) {
      changes.push({ from, insert });
    }
    insert = after;
    if (len(insert) > 0) {
      from = to;
      changes.push({ from, insert });
    }
  }
  if (!changes.length) return false;
  dispatch(state.update({ changes, userEvent: "input.encloseSelection" }));
  return true;
}

export function mergeDuplicateLines({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  function iter(iter: TextIterator, changes: any[], start: number = 0) {
    let seenLines: Set<string> = new Set();
    for (let li of iterLines(iter)) {
      let s = li[1];
      if (seenLines.has(s)) {
        let from = start + li[0];
        let to = from + len(s) + len(li[2]);
        changes.push({ from, to });
      } else {
        seenLines.add(s);
      }
    }
  }
  return runOnIter({ state, dispatch }, iter, "delete.mergeduplicatelines");
}

export function deleteDuplicateLines({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  function iter(iter: TextIterator, changes: any[], start: number = 0) {
    let seenLines: Map<string, number[]> = new Map();
    for (let li of iterLines(iter)) {
      let s = li[1];
      if (seenLines.has(s)) {
        let first = seenLines.get(s);
        if (first[0] === 0) {
          let from = start;
          let to = from + first[1] + first[2];
          changes.push({ from, to });
          first[0] = 1;
        }
        let from = start + li[0];
        let to = from + len(s) + len(li[2]);
        changes.push({ from, to });
      } else {
        let v = [0, start + li[0], len(li[1]) + len(li[2])];
        seenLines.set(s, v);
      }
    }
  }
  return runOnIter({ state, dispatch }, iter, "delete.deleteduplicatelines");
}

export function compressWhitespace({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  function iter(iter: TextIterator, changes: any[], start: number = 0) {
    for (let li of iterLines(iter)) {
      let s = li[1];
      let s2 = strCompressWS(s);
      if (s !== s2) {
        let from = start + li[0];
        let to = from + len(s);
        changes.push({ from, to });
        changes.push({ from: to, insert: s2 });
      }
    }
  }
  return runOnIter({ state, dispatch }, iter, "delete.compresswhitespace");
}

export function padWithSpaces({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  function iter(iter: TextIterator, changes: any[], start: number = 0) {
    let lines = [];
    let max = 0;
    for (let li of iterLines(iter)) {
      // must make copy
      lines.push([li[0], li[1], li[2]]);
      let n = len(li[1]);
      if (n > max) {
        max = n;
      }
    }

    for (let li of lines) {
      let llen = len(li[1]);
      let n = max - llen;
      if (n > 0) {
        let from = start + li[0] + llen;
        let insert = " ".repeat(n); // TODO: faster? Maybe splice of a larger string?
        changes.push({ from, insert });
      }
    }
  }
  return runOnIter({ state, dispatch }, iter, "delete.padwithspaces");
}

export function replaceSelections({ state, dispatch }: {state: EditorState, dispatch: Function}, convertFn: Function): boolean {
  if (state.readOnly) return false;
  const changes = [];
  const sel = state.selection;

  // TOOD: if empty selection, set selection to after befor
  for (const { from, to } of sel.ranges) {
    if (from === to) {
      continue;
    }
    const s = state.sliceDoc(from, to);
    const insert = convertFn(s);
    changes.push({ from, to });
    // TODO: make this as a selection
    changes.push({ from, insert });
  }
  if (!changes.length) return false;
  dispatch(state.update({ changes, userEvent: "input.replaceselection" }));
  return true;
}

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function cmdBase64EncodeStandard({ state, dispatch }) {
  return replaceSelections({ state, dispatch }, b64EncodeStandard);
}

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function cmdBase64EncodeURLSafe({ state, dispatch }) {
  return replaceSelections({ state, dispatch }, b64EncodeURLSafe);
}

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function cmdBase64EncodeHtmlImage({ state, dispatch }) {
  return replaceSelections({ state, dispatch }, b64EncodeHtmlImage);
}

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function cmdBase64Decode({ state, dispatch }) {
  return replaceSelections({ state, dispatch }, b64Decode);
}

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function cmdBase64DecodeAsHex({ state, dispatch }) {
  return replaceSelections({ state, dispatch }, b64DecodeAsHex);
}

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function cmdUrlEncode({ state, dispatch }) {
  return replaceSelections({ state, dispatch }, urlEncode);
}

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function cmdUrlDecode({ state, dispatch }) {
  return replaceSelections({ state, dispatch }, urlDecode);
}

export function replaceSelectionsWithStr({ state, dispatch }: {state: EditorState, dispatch: Function}, insert: string): string {
  let changes = [];
  let sel = state.selection;
  let res = "";
  for (let { from, to } of sel.ranges) {
    if (from === to) {
      continue;
    }
    let s = state.sliceDoc(from, to);
    res += s;
    changes.push({ from, to });
    // TODO: make this as a selection
    changes.push({ from, insert });
  }
  if (!changes.length) return "";
  dispatch(state.update({ changes, userEvent: "input.replaceselection" }));
  return res;
}

export async function swapSelectionsWithClipboard({ state, dispatch }: {state: EditorState, dispatch: Function}): Promise<boolean> {
  if (state.readOnly) return false;
  let sel = state.selection;
  if (isEmptySelection(sel)) {
    return false;
  }
  let cp = await getClipboard();
  if (cp === "") {
    return false;
  }
  let nc = replaceSelectionsWithStr({ state, dispatch }, cp);
  setClipboard(nc);
  return true;
}

export function transposeLines({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  if (state.readOnly) return false;
  let sel = state.selection;
  // find the line where last selection ends
  let pos = sel.ranges[len(sel.ranges) - 1].to;
  let doc = state.doc;
  let l = doc.lineAt(pos);
  if (l.number < 2) {
    // if first line, nothing to do
    return false;
  }
  let lineBefore = doc.line(l.number - 1);
  let lineS = doc.sliceString(l.from, l.to);
  let lineBeforeS = doc.sliceString(lineBefore.from, lineBefore.to);
  let changes = [];
  changes.push({ from: l.from, to: l.to });
  changes.push({ from: lineBefore.from, to: lineBefore.to });
  changes.push({ from: l.from, insert: lineBeforeS });
  changes.push({ from: lineBefore.from, insert: lineS });
  dispatch(state.update({ changes, userEvent: "input.transposelines" }));
  return true;
}

export function duplicateLine({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  if (state.readOnly) return false;
  let sel = state.selection;
  // find the line where last selection ends
  let pos = sel.ranges[len(sel.ranges) - 1].to;
  let doc = state.doc;
  let l = doc.lineAt(pos);
  let insert = doc.sliceString(l.from, l.to);
  let from = 0;
  // TODO: why does it ad dto selection?
  if (l.number >= doc.lines) {
    from = doc.length;
    insert = "\n" + insert;
  } else {
    let nextLine = doc.line(l.number + 1);
    from = nextLine.from;
    insert = insert + "\n";
  }
  let changes = [{ from, insert }];
  dispatch(state.update({ changes, userEvent: "input.duplicateline" }));
  return true;
}

export function cutLine({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  if (state.readOnly) return false;
  let sel = state.selection;
  // find the line where last selection ends
  let pos = sel.ranges[len(sel.ranges) - 1].to;
  let doc = state.doc;
  let l = doc.lineAt(pos);
  let s = doc.sliceString(l.from, l.to) + "\n";
  // TODO: will it work with different line endings?
  let changes = [{ from: l.from, to: l.to + 1 }];
  dispatch(state.update({ changes, userEvent: "input.cutline" }));
  setClipboard(s);
  return true;
}

export function copyLine({ state }: {state: EditorState}): boolean {
  let sel = state.selection;
  // find the line where last selection ends
  let pos = sel.ranges[len(sel.ranges) - 1].to;
  let doc = state.doc;
  let l = doc.lineAt(pos);
  // TODO: will it work with different line endings?
  let s = doc.sliceString(l.from, l.to) + "\n";
  setClipboard(s);
  return true;
}

export function joinLines({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  if (state.readOnly) return false;
  let sel = state.selection;
  // find the lines where last selection ends
  let lastSel = sel.ranges[len(sel.ranges) - 1];
  let doc = state.doc;
  let startLine = doc.lineAt(lastSel.from);
  let endLine = doc.lineAt(lastSel.to);
  if (startLine.number === endLine.number) {
    return false;
  }
  let from = startLine.from;
  let to = Math.min(endLine.to + 1, doc.length);
  let changes = [];
  changes.push({ from, to });
  let s = "";
  for (let i = startLine.number; i <= endLine.number; i++) {
    let l = doc.line(i);
    s += l.text + " ";
  }
  changes.push({ from, insert: s });
  // TODO: preserve selection as in notepad2?
  dispatch(state.update({ changes, userEvent: "input.joinlines" }));
  return true;
}

export function replaceSelectionsWith({ state, dispatch }: {state: EditorState, dispatch: Function}, fn: Function): boolean {
  if (state.readOnly) return false;
  let changes = [];
  let ranges = [];
  let sel = state.selection;
  for (let { from, to } of sel.ranges) {
    if (from === to) {
      continue;
    }
    let s = state.sliceDoc(from, to);
    let insert = fn(s);
    if (s !== null) {
      changes.push({ from, to });
      changes.push({ from, insert });
      ranges.push(EditorSelection.range(from, from + len(insert)));
    }
  }
  if (!changes.length) return false;
  dispatch(
    state.update({
      changes,
      selection: EditorSelection.create(ranges),
      userEvent: "input.replaceselectionwith",
    })
  );
  return true;
}

export function iterSelections(
  { state, dispatch }: {state: EditorState, dispatch: Function},
  fn: Function,
  eventName: string,
  skipEmpty: boolean = false
): boolean {
  if (state.readOnly) return false;
  let changes = [];
  let ranges = [];
  for (let sel of state.selection.ranges) {
    if (skipEmpty && sel.from === sel.to) {
      continue;
    }
    fn(state, sel, changes);
  }
  if (len(changes) + len(ranges) === 0) {
    return false;
  }
  let update = {
    changes,
    userEvent: eventName,
  };
  if (len(ranges) > 0) {
    update["selection"] = EditorSelection.create(ranges);
  }

  dispatch(state.update(update));
  return true;
}

export function dumpSelections({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  console.log("dumpSelections:");
  function iterFn(state, sel, changes, ranges) {
    console.log(
      `  range: ${sel.from} => ${sel.to}, anchor: ${sel.anchor}, head: ${sel.head}`
    );
  }
  return iterSelections(
    { state, dispatch },
    iterFn,
    "input.dumpeselections",
    false
  );
}

export function encloseSelections({ state, dispatch }: {state: EditorState, dispatch: Function}, before: string, after: string): boolean {
  function iterFn(state, { from, to }, changes, ranges) {
    if (len(before) > 0) {
      changes.push({ from, insert: before });
    }
    if (len(after) > 0) {
      changes.push({ from: to, insert: after });
    }
  }
  return iterSelections(
    { state, dispatch },
    iterFn,
    "input.encloseselections",
    false
  );
}

export function insertAfterSelection2({ state, dispatch }: {state: EditorState, dispatch: Function}, fn: Function): boolean {
  function iterFn(state, { from, to }, changes, ranges) {
    let s = state.sliceDoc(from, to);
    let insert = fn(s);
    if (s !== null) {
      changes.push({ from: to, insert });
      ranges.push(EditorSelection.range(to, to + len(insert)));
    }
  }
  return iterSelections(
    { state, dispatch },
    iterFn,
    "input.replaceselectionwith",
    true
  );
}

export function insertAfterSelection({ state, dispatch }: {state: EditorState, dispatch: Function}, fn: Function): boolean {
  if (state.readOnly) return false;
  let changes = [];
  let ranges = [];
  let sel = state.selection;
  for (let { from, to } of sel.ranges) {
    if (from === to) {
      continue;
    }
    let s = state.sliceDoc(from, to);
    let insert = fn(s);
    if (s !== null) {
      changes.push({ from: to, insert });
      ranges.push(EditorSelection.range(to, to + len(insert)));
    }
  }
  if (!changes.length) return false;
  dispatch(
    state.update({
      changes,
      selection: EditorSelection.create(ranges),
      userEvent: "input.replaceselectionwith",
    })
  );
  return true;
}

export function insertText({ state, dispatch }: {state: EditorState, dispatch: Function}, fnOrStr: Function | string): boolean {
  if (state.readOnly) return false;
  let insert = typeof fnOrStr === "string" ? fnOrStr : fnOrStr();
  if (insert === "") {
    return false;
  }
  let sel = state.selection.ranges[0];
  let changes = [];
  changes.push(sel); // remove text in this selection, if any
  changes.push({ from: sel.from, insert });
  // put the cursor at the end of text
  let ranges = [
    EditorSelection.range(sel.from + len(insert), sel.from + len(insert)),
  ];
  dispatch(
    state.update({
      changes,
      selection: EditorSelection.create(ranges),
      userEvent: "input.insert",
    })
  );
  return true;
}

export function goToSelectionStartEnd({ state, dispatch }: {state: EditorState, dispatch: Function}, end: boolean): boolean {
  // anchor is where selection starts, head is where the cursor is
  // going to start: head to from, anchor to to
  let { from, to, anchor, head } = state.selection.ranges[0];
  let newAnchor = to;
  let newHead = from;
  if (end) {
    newAnchor = from;
    newHead = to;
  }
  const ranges = [EditorSelection.range(newAnchor, newHead)];
  dispatch(
    state.update({
      selection: EditorSelection.create(ranges),
      userEvent: "input.selecttodocstart",
    })
  );
  return true;
}

export function goToPos({ state, dispatch }: {state: EditorState, dispatch: Function}, pos: number) {
  console.log("goToPos: pos:", pos);
  const ranges = [EditorSelection.range(pos, pos)];
  dispatch(
    state.update({
      selection: EditorSelection.create(ranges),
      userEvent: "input.goToPos",
    })
  );
  return true;
}

export function selectToDocStart({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  let pos = 0;
  for (let { to } of state.selection.ranges) {
    pos = to;
  }
  let ranges = [EditorSelection.range(0, pos)];
  dispatch(
    state.update({
      selection: EditorSelection.create(ranges),
      userEvent: "input.selecttodocstart",
    })
  );
  return true;
}

export function selectToDocEnd({ state, dispatch }: {state: EditorState, dispatch: Function}): boolean {
  let pos = state.selection.ranges[0].from;
  let ranges = [EditorSelection.range(pos, state.doc.length)];
  dispatch(
    state.update({
      selection: EditorSelection.create(ranges),
      userEvent: "input.selecttodocend",
    })
  );
  return true;
}

const kFoldingStateFolded = 0;
const kFoldingStateUnfolded = 1;

let foldingState = kFoldingStateUnfolded;

export function setIsFolded(isFolded: boolean) {
  foldingState = isFolded ? kFoldingStateFolded : kFoldingStateUnfolded;
}

export function toggleFoldAll(editorView: EditorView): boolean {
  console.log("toggleFoldAll");
  switch (foldingState) {
    case kFoldingStateUnfolded:
      foldAll(editorView);
      foldingState = kFoldingStateFolded;
      break;
    case kFoldingStateFolded:
      unfoldAll(editorView);
      foldingState = kFoldingStateUnfolded;
      break;
    default:
      throwIf(true, `invalid foldingState ${foldingState}`);
  }
  return true;
}
