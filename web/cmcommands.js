/** @typedef { import("@codemirror/state").EditorState} EditorState */
/** @typedef {import("@codemirror/state").EditorSelection} EditorSelection */
/** @typedef {import("@codemirror/state").TextIterator} TextIterator */

import { len } from "./util";

/**
 *
 * @param {EditorSelection} sel
 */
function isEmptySelection(sel) {
  if (len(sel.ranges) > 1) {
    return false;
  }
  return sel.ranges[0].empty;
}

/**
 * @param {*} param0
 * @param {Function} fn
 * @param {string} userEvent
 * @returns
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
 * @param {*} param0
 * @param {Function} fn
 * @param {string} userEvent
 * @returns
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
let iterLinesRes = [0, "", ""];
/**
 * @param {TextIterator} iter
 * @returns {*}
 */
export function* iterLines(iter) {
  let pos = 0;
  iterLinesRes[0] = 0;
  iterLinesRes[1] = "";
  while (true) {
    iter.next();
    if (iter.done) {
      iterLinesRes[2] = "";
      yield iterLinesRes;
      return;
    }
    if (iter.lineBreak) {
      iterLinesRes[2] = iter.value;
      yield iterLinesRes;
      pos += len(iter.value);
      iterLinesRes[0] = pos;
      iterLinesRes[1] = "";
    } else {
      // delay emiting line to next lineBreak or done
      iterLinesRes[0] = pos;
      iterLinesRes[1] = iter.value;
      pos += len(iter.value);
    }
  }
}

let rxLeadingWS = /^\s+/;
/**
 * @param {{state: EditorState, dispatch: any}} arg
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

let rxTrailingWS = /\s+$/;
/**
 * @param {{state: EditorState, dispatch: any}} arg
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
 * @param {{state: EditorState, dispatch: any}} arg
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
 * @param {{state: EditorState, dispatch: any}} arg
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
 * @param {{state: EditorState, dispatch: any}} arg
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
 * for each line in iter returns 2 array elements: line position, length
 * @param {TextIterator} iter
 * @returns {number[]}
 */
function collectLineLengths(iter) {
  let res = [];
  for (let pos = 0, prev = ""; ; ) {
    iter.next();
    if (iter.lineBreak || iter.done) {
      res.push(pos - prev.length, prev.length);
      if (iter.done) break;
      prev = "";
    } else {
      prev = iter.value;
    }
    pos += iter.value.length;
  }
  return res;
}

/**
 * replace 2 or more consequitive blank lines with single blank line
 * @param {{state: EditorState, dispatch: any}} arg
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
 * @param {{state: EditorState, dispatch: any}} arg
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
 * @param {{state: EditorState, dispatch: any}} arg
 * @param {string} before
 * @param {string} after
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
 * @param {{state: EditorState, dispatch: any}} arg
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
 * @param {{state: EditorState, dispatch: any}} arg
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

const wsRx = /\s{2,}/g;
/**
 * @param {string} s
 * @returns {string}
 */
export function strCompressWS(s) {
  // TODO: also remove single space from the beginning?
  return s.replaceAll(wsRx, " ");
}

/**
 * @param {{state: EditorState, dispatch: any}} arg
 */
export function compressWhitespace({ state, dispatch }) {
  if (state.readOnly) return false;
  let changes = [];

  /**
   * @param {TextIterator} iter
   * @param {number} start
   */
  function iter(iter, start = 0) {
    let pos = 0;
    while (true) {
      if (iter.done) return;
      if (!iter.lineBreak) {
      }
      pos += iter.value.length;
    }

    for (let pos = 0; ; ) {
      iter.next();
      if (iter.lineBreak || iter.done) {
        let m = prev.match(/^\s+/);
        if (m != null) {
          let n = m[0].length;
          let lineLen = prev.length;
          let from = start + pos - lineLen;
          let to = from + n;
          changes.push({ from: from, to: to });
        }
        if (iter.done) break;
        prev = "";
      } else {
        prev = iter.value;
      }
    }
  }
  let doc = state.doc;
  let sel = state.selection;
  if (isEmptySelection(sel)) {
    iter(doc.iter());
  } else {
    for (let range of sel.ranges) {
      let { from, to } = range;
      iter(doc.iterRange(from, to), from);
    }
  }
  if (!changes.length) return false;
  dispatch(state.update({ changes, userEvent: "edit.compressWhitespace" }));
  return true;
}

/**
 * @param {{state: EditorState, dispatch: any}} arg
 */
export function padWithSpaces({ state, dispatch }) {
  if (state.readOnly) return false;
  let changes = [];
  function iter(iter, start = 0) {
    let linesInfo = collectLineLengths(iter);
    let nLines = len(linesInfo) / 2;
    let max = 0;
    for (let i = 0; i < nLines; i++) {
      if (linesInfo[i * 2 + 1] > max) {
        max = linesInfo[i * 2 + 1];
      }
    }
    if (max === 0) {
      return;
    }
    for (let i = 0; i < nLines; i++) {
      let n = max - linesInfo[i * 2 + 1];
      if (n > 0) {
        let insert = " ".repeat(n); // TODO: faster? Maybe splice of a larger string?
        let from = start + linesInfo[i * 2] + linesInfo[i * 2 + 1];
        changes.push({ from, insert });
      }
    }
  }
  let doc = state.doc;
  let sel = state.selection;
  if (isEmptySelection(sel)) {
    iter(doc.iter());
  } else {
    for (let range of sel.ranges) {
      let { from, to } = range;
      iter(doc.iterRange(from, to), from);
    }
  }

  if (!changes.length) return false;
  dispatch(state.update({ changes, userEvent: "edit.padWithSpaces" }));
  return true;
}
