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

// TOD: perf: return without allocating. perf.link says it's faster (but https://jsbench.me/ doesn't)
// https://perf.link/#eyJpZCI6InVuZm51MDVrdG4yIiwidGl0bGUiOiJGaW5kaW5nIG51bWJlcnMgaW4gYW4gYXJyYXkgb2YgMTAwMCIsImJlZm9yZSI6ImZ1bmN0aW9uKiB0ZXN0MShuKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgeWllbGQgW2ksIGldO1xuICB9XG59XG5cbmxldCByZXMgPSBbMCwgMF07XG5mdW5jdGlvbiogdGVzdDIobikge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgIHJlc1swXSA9IGk7XG4gICAgcmVzWzFdID0gaTtcbiAgICB5aWVsZCByZXM7XG4gIH1cbn0iLCJ0ZXN0cyI6W3sibmFtZSI6IkZpbmQgaXRlbSAxMDAiLCJjb2RlIjoiXG50ZXN0MSgxMDAwKTsiLCJydW5zIjpbMjAwODAwMCw2MjIwMDAsMzUxMDAwLDI5NTYwMDAsMTI3MTAwMCwxOTIxMDAwLDU2NzAwMDAsNjg1NDAwMCw1MDczMDAwLDI2MDAwMDAsNTIwNTAwMCw3MzExMDAwLDM1MDkwMDAsNjQ3MDAwLDQyMzEwMDAsNzQwNTAwMCwwLDI1MzMwMDAsMTE1OTAwMCw2MTcwMDAsMzAzNjAwMCw0Nzc2MDAwLDE4NzkwMDAsMzQ5ODAwMCwyNzYyMDAwLDM2NTAwMCwyNDMwMDAsMjcwODAwMCw2OTEwMDAsMzY5NjAwMCw5NzAwMDAsMzA0NDAwMCwxODM3MDAwLDI4NjYwMDAsMjM3NTAwMCwyMjMxMDAwLDQ1MTYwMDAsMTQyMzAwMCwyMTY5MDAwLDc4MDAwMDAsMTU3MzAwMCwyNjg1MDAwLDU3NzAwMCwyMzM2MDAwLDQzMDgwMDAsMjMyNjAwMCwxNzQzMDAwLDE0NzAwMDAsMzg2NzAwMCwyNDIzMDAwLDIyMjgwMDAsMTI3OTAwMCw2NzgwMDAsMTcyNzAwMCwyMzI4MDAwLDE4MTAwMCwyNzYyMDAwLDU0MzkwMDAsMTQwMjAwMCwzMDUyMDAwLDk2OTAwMCwxNzY5MDAwLDE0MjEwMDAsMjA0NTAwMCw1NTUwMDAsMTQ2MjAwMCw1OTg0MDAwLDIyNDMwMDAsNDYyNzAwMCwyMDMzMDAwLDI1NjQwMDAsMzIzMTAwMCwxMDkxMDAwLDMxODAwMCw0NjE1MDAwLDM4MDIwMDAsMzA3ODAwMCwyNjkxMDAwLDE0NjcwMDAsNjE3MTAwMCw3NTMzMDAwLDQyMjcwMDAsMTA1MjAwMCw3Njk2MDAwLDYxNTAwMCwyNDQ5MDAwLDExMzYwMDAsMTk4OTAwMCw2NjAwMDAsMzEwMzAwMCwxMjgxMDAwLDI0NTgwMDAsMTEwNzAwMCwxNTgzMDAwLDIzNzUwMDAsMzUyNTAwMCwxNTg5MDAwLDI2OTkwMDAsNjMwMDAsMjU4OTAwMF0sIm9wcyI6MjYxMDc3MH0seyJuYW1lIjoiRmluZCBpdGVtIDEwMCIsImNvZGUiOiJcbnRlc3QyKDEwMDApOyIsInJ1bnMiOlsyMzQwMDAwLDYyMTAwMCwxMzY2MDAwLDE0ODkwMDAsMjM4MDAwLDE1MzgwMDAsNDQzMzAwMCw2MTcxMDAwLDM4NjQwMDAsNjg4MzAwMCw0MDYzMDAwLDYxNzEwMDAsMTUzMDAwMCw2MTcxMDAwLDI2NjgwMDAsNDY0NDAwMCwzMDc3MDAwLDQyMTEwMDAsMTE0MDAwLDYxNzEwMDAsMTM5OTAwMCwzNjg1MDAwLDMxNjgwMDAsMjM0MDAwMCwxODQ0MDAwLDM2OTAwMCw3MDE2MDAwLDE3NjAwMDAsNDMyODAwMCwxMjE3MDAwLDU5NDAwMCwxMDAzMDAwLDYxODIwMDAsODk0MDAwLDE4MTAwMCw1NDg3MDAwLDEyNzgwMDAsNjg5MjAwMCwxMzE5MDAwLDk4NTAwMCw0MzU2MDAwLDg3MjAwMCw2Njc1MDAwLDE1OTEwMDAsMTE1MzAwMCwxMTE0MDAwLDYxNzEwMDAsNzY0MTAwMCw2MTcxMDAwLDQ4ODAwMCw2MTcxMDAwLDEzMzEwMDAsNjk5NTAwMCw5NjEwMDAsMjk2MDAwLDczMDQwMDAsNzcxMDAwLDIyOTgwMDAsNTgyMDAwLDY3MzAwMDAsNzczMzAwMCw2ODQ4MDAwLDY5MjUwMDAsMzAwMDAsNjE3MTAwMCwxMjYyMDAwLDIyNzkwMDAsNjc4NTAwMCwzMjc3MDAwLDYwNjkwMDAsMTM4NzAwMCw4MDUwMDAsMzAxMDAwLDI0NDIwMDAsMzI5MTAwMCwxNTU3MDAwLDY1NDMwMDAsMTY2MDAwMCw2NTQyMDAwLDYxNzEwMDAsNjE3MTAwMCwzODAyMDAwLDcyOTkwMDAsNzA2NTAwMCw3MDEyMDAwLDQ4NjEwMDAsMTAwMCw2NTEwMDAwLDYxNzEwMDAsMTg0OTAwMCw1MDA3MDAwLDU2NzAwMCwzMDk1MDAwLDcxMDEwMDAsMzU4MDAwLDEwMDAsNzAwNjAwMCwxODM0MDAwLDYxNzEwMDAsMTc3ODAwMF0sIm9wcyI6MzUxMTEyMH1dLCJ1cGRhdGVkIjoiMjAyMy0wMi0yMFQwMDoxNDo1OS43NThaIn0%3D

// iterates content of lines, skipping newline characaters
// for each element returns [pos, line string]
// TODO: make it faster by not allocating an array for each result
// re-use a single global array
/**
 * @param {TextIterator} iter
 * @returns {*}
 */
export function* iterLines(iter) {
  let pos = 0;
  let prevWasLineBreak = true;
  while (true) {
    iter.next();
    if (iter.done) {
      return;
    }
    if (iter.lineBreak) {
      if (prevWasLineBreak) {
        // emit empty lines
        yield [pos, ""];
      }
      prevWasLineBreak = true;
    } else {
      prevWasLineBreak = false;
      yield [pos, iter.value];
    }
    pos += len(iter.value);
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
          let to = from + 1;
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
  if (state.readOnly) return false;
  let changes = [];
  let doc = state.doc;
  let sel = state.selection;
  let docLen = doc.length;
  /**
   * @param {TextIterator} iter
   * @param {number} start
   */
  function removeBlanksIter(iter, start = 0) {
    let ll = collectLineLengths(iter);
    let nLines = len(ll) / 2;
    for (let i = 0; i < nLines; i++) {
      let llen = ll[i * 2 + 1];
      if (llen == 0) {
        let from = start + ll[i * 2];
        let to = Math.min(from + 1, docLen);
        changes.push({ from, to });
      }
    }
  }

  if (isEmptySelection(sel)) {
    removeBlanksIter(doc.iter());
  } else {
    for (let { from, to } of sel.ranges) {
      let iter = doc.iterRange(from, to);
      removeBlanksIter(iter, from);
    }
  }
  if (!changes.length) return false;
  dispatch(state.update({ changes, userEvent: "input.removeblanklines" }));
  return true;
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
  dispatch(state.update({ changes, userEvent: "input.removeblanklines" }));
  return true;
}

/**
 * TODO: more efficient implementation which uses line lengths
 * to optimize back searches and use less memory
 * @param {{state: EditorState, dispatch: any}} arg
 */
export function mergeDuplicateLines({ state, dispatch }) {
  if (state.readOnly) return false;

  let doc = state.doc;
  let sel = state.selection;
  if (isEmptySelection(sel)) {
    return;
  }
  let docLen = doc.length;
  let changes = [];

  /** @type {Map<string, undefined>} */
  let seenLines = new Map();

  /**
   * @param {TextIterator} iter
   * @param {number} start
   */
  function delIter(iter, start = 0) {
    for (let pos = 0, prev = ""; ; ) {
      iter.next();
      if (iter.lineBreak || iter.done) {
        if (prev !== "") {
          if (seenLines.has(prev)) {
            let from = start + pos - prev.length - 1;
            let to = Math.min(from + prev.length + 1, docLen);
            changes.push({ from, to });
          } else {
            seenLines.set(prev);
          }
        }
        if (iter.done) break;
        prev = "";
      } else {
        prev = iter.value;
      }
      pos += iter.value.length;
    }
  }
  if (!isEmptySelection(sel)) {
    for (let range of sel.ranges) {
      let { from, to } = range;
      delIter(doc.iterRange(from, to), from);
    }
  }
  if (!changes.length) return false;
  dispatch(state.update({ changes, userEvent: "delete.mergeduplicatelines" }));
  return true;
}

/**
 * @param {{state: EditorState, dispatch: any}} arg
 */
export function deleteDuplicateLines({ state, dispatch }) {
  if (state.readOnly) return false;

  let doc = state.doc;
  let sel = state.selection;
  if (isEmptySelection(sel)) {
    return;
  }
  let changes = [];
  let docLen = doc.length;
  /** @type {Map<string, number[]>} */
  let seenLines = new Map();

  /**
   * @param {TextIterator} iter
   * @param {number} start
   */
  function delIter(iter, start = 0) {
    for (let pos = 0; ; ) {
      iter.next();
      if (iter.done) break;
      // TODO: not sure if can be different lineSeparator
      let s = iter.value;
      if (s !== "\n") {
        if (seenLines.has(s)) {
          seenLines.get(s).push(pos);
        } else {
          seenLines.set(s, [pos]);
        }
      }
      pos += iter.value.length;
    }
    for (let kv of seenLines) {
      let a = kv[1];
      if (len(a) < 2) {
        continue;
      }
      let slen = len(kv[0]) + 1;
      for (let pos of a) {
        let from = start + pos;
        let to = Math.min(from + slen, docLen);
        changes.push({ from, to });
      }
    }
  }
  for (let range of sel.ranges) {
    let { from, to } = range;
    delIter(doc.iterRange(from, to), from);
  }
  if (!changes.length) return false;
  dispatch(state.update({ changes, userEvent: "delete.deleteduplicatelines" }));
  return true;
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
