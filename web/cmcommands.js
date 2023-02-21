/** @typedef { import("@codemirror/state").EditorState} EditorState */
/** @typedef {import("@codemirror/state").EditorSelection} EditorSelection */
/** @typedef {import("@codemirror/state").TextIterator} TextIterator */

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
import { getClipboard, len, setClipboard } from "./util";

/**
 * @param {EditorSelection} sel
 * @returns {boolean}
 */
function isEmptySelection(sel) {
  if (len(sel.ranges) > 1) {
    return false;
  }
  return sel.ranges[0].empty;
}

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @param {Function} fn
 * @param {string} userEvent
 * @returns {boolean}
 */
function runOnSelIter({ state, dispatch }, fn, userEvent) {
  if (state.readOnly) return false;
  let changes = [];
  let doc = state.doc;
  let sel = state.selection;
  if (isEmptySelection(sel)) {
    return false;
  }
  for (let range of sel.ranges) {
    let { from, to } = range;
    fn(doc.iterRange(from, to), changes, from);
  }
  if (!changes.length) return false;
  dispatch(state.update({ changes, userEvent }));
  return true;
}

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @param {Function} fn
 * @param {string} userEvent
 * @returns {boolean}
 */
function runOnIter({ state, dispatch }, fn, userEvent) {
  if (state.readOnly) return false;
  let changes = [];
  let doc = state.doc;
  let sel = state.selection;
  if (isEmptySelection(sel)) {
    fn(doc.iter(), changes);
  } else {
    for (let range of sel.ranges) {
      let { from, to } = range;
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
/**
 * @param {TextIterator} iter
 * @returns {*}
 */
export function* iterLines(iter) {
  let pos = 0;
  let res = [0, "", ""];
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
/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function deleteLeadingWhitespace({ state, dispatch }) {
  /**
   * @param {TextIterator} iter
   * @param {any[]} changes
   * @param {number} start
   */
  function iter(iter, changes, start = 0) {
    for (let li of iterLines(iter)) {
      let s = li[1];
      let m = s.match(rxLeadingWS);
      if (m != null) {
        let n = m[0].length;
        let from = li[0] + start;
        let to = from + n;
        changes.push({ from, to });
      }
    }
  }
  return runOnIter({ state, dispatch }, iter, "delete.leadingwhitespace");
}

const rxTrailingWS = /\s+$/;
/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function deleteTrailingWhitespace({ state, dispatch }) {
  /**
   * @param {TextIterator} iter
   * @param {any[]} changes
   * @param {number} start
   */
  function iter(iter, changes, start = 0) {
    for (let li of iterLines(iter)) {
      let s = li[1];
      let m = s.match(rxTrailingWS);
      if (m != null) {
        let n = m[0].length;
        let from = start + li[0] + len(s) - n;
        let to = from + n;
        changes.push({ from, to });
      }
    }
  }
  return runOnIter({ state, dispatch }, iter, "delete.trailinghitespace");
}

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function deleteFirstChar({ state, dispatch }) {
  /**
   * @param {TextIterator} iter
   * @param {any[]} changes
   * @param {number} start
   */
  function iter(iter, changes, start = 0) {
    for (let li of iterLines(iter)) {
      let s = li[1];
      if (len(s) > 0) {
        let from = start + li[0];
        let to = from + 1;
        changes.push({ from, to });
      }
    }
  }
  return runOnSelIter({ state, dispatch }, iter, "delete.firstchar");
}

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function deleteLastChar({ state, dispatch }) {
  /**
   * @param {TextIterator} iter
   * @param {any[]} changes
   * @param {number} start
   */
  function iter(iter, changes, start = 0) {
    for (let li of iterLines(iter)) {
      let s = li[1];
      if (len(s) > 0) {
        let from = start + li[0] + len(s) - 1;
        let to = from + 1;
        changes.push({ from, to });
      }
    }
  }
  return runOnSelIter({ state, dispatch }, iter, "delete.lastchar");
}

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function duplicateSelection({ state, dispatch }) {
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

/**
 * replace 2 or more consequitive blank lines with single blank line
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function mergeBlankLines({ state, dispatch }) {
  /**
   * @param {TextIterator} iter
   * @param {any[]} changes
   * @param {number} start
   */
  function iter(iter, changes, start = 0) {
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

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function removeBlankLines({ state, dispatch }) {
  /**
   * @param {TextIterator} iter
   * @param {any[]} changes
   * @param {number} start
   */
  function iter(iter, changes, start = 0) {
    for (let li of iterLines(iter)) {
      let s = li[1];
      if (len(s) === 0) {
        let from = start + li[0];
        let to = from + len(li[2]);
        changes.push({ from, to });
      }
    }
  }
  return runOnIter({ state, dispatch }, iter, "delete.removeblanklines");
}

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @param {string} before
 * @param {string} after
 * @returns {boolean}
 */
export function encloseSelection({ state, dispatch }, before, after) {
  if (state.readOnly) return false;
  let changes = [];
  let sel = state.selection;

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

/**
 * TODO: more efficient implementation which uses line lengths
 * to optimize back searches and use less memory
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function mergeDuplicateLines({ state, dispatch }) {
  /**
   * @param {TextIterator} iter
   * @param {any[]} changes
   * @param {number} start
   */
  function iter(iter, changes, start = 0) {
    /** @type {Set<string>} */
    let seenLines = new Set();
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

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function deleteDuplicateLines({ state, dispatch }) {
  /**
   * @param {TextIterator} iter
   * @param {any[]} changes
   * @param {number} start
   */
  function iter(iter, changes, start = 0) {
    /** @type {Map<string, number[]>} */
    let seenLines = new Map();
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

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function compressWhitespace({ state, dispatch }) {
  /**
   * @param {TextIterator} iter
   * @param {any[]} changes
   * @param {number} start
   */
  function iter(iter, changes, start = 0) {
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

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function padWithSpaces({ state, dispatch }) {
  /**
   * @param {TextIterator} iter
   * @param {any[]} changes
   * @param {number} start
   */
  function iter(iter, changes, start = 0) {
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

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @param {Function} convertFn
 * @returns {boolean}
 */
export function replaceSelections({ state, dispatch }, convertFn) {
  if (state.readOnly) return false;
  let changes = [];
  let sel = state.selection;

  // TOOD: if empty selection, set selection to after befor
  for (let { from, to } of sel.ranges) {
    if (from === to) {
      continue;
    }
    let s = state.sliceDoc(from, to);
    let insert = convertFn(s);
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

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @param {string} insert
 * @returns {string}
 */
export function replaceSelectionsWithStr({ state, dispatch }, insert) {
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

/**
 * Note: works differently than notepad2 if multiple selection, but notepad2
 * seems to be wrong
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {Promise<boolean>}
 */
export async function swapSelectionsWithClipboard({ state, dispatch }) {
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

/**
 * swaps current line with the line before it
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function transposeLines({ state, dispatch }) {
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

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function duplicateLine({ state, dispatch }) {
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

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function cutLine({ state, dispatch }) {
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

/**
 * @param {{state: EditorState}} arg0
 * @returns {boolean}
 */
export function copyLine({ state }) {
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

// /**
//  * @param {{state: EditorState, dispatch: Function}} arg0
//  * @returns {boolean}
//  */
// export function deleteLine({ state, dispatch }) {
//   if (state.readOnly) return false;
//   let sel = state.selection;
//   // find the line where last selection ends
//   let pos = sel.ranges[len(sel.ranges) - 1].to;
//   let doc = state.doc;
//   let l = doc.lineAt(pos);
//   // TODO: will it work with different line endings?
//   let changes = [{ from: l.from, to: l.to + 1 }];
//   dispatch(state.update({ changes, userEvent: "input.deleteline" }));
//   setClipboard(s);
//   return true;
// }

/**
 * @param {{state: EditorState, dispatch: Function}} arg0
 * @returns {boolean}
 */
export function joinLines({ state, dispatch }) {
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
