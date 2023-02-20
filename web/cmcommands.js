/** @typedef { import("@codemirror/state").EditorState} EditorState */
/** @typedef {import("@codemirror/state").EditorSelection} EditorSelection */
/** @typedef {import("@codemirror/state").TextIterator} TextIterator */

import { Base64 } from "js-base64";
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
 * @param {{state: EditorState, dispatch: any}} arg
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
 * @param {string} s
 * @returns {string}
 */
function b64pad(s) {
  let n = 4 - (len(s) % 4);
  switch (n) {
    case 1:
      return s + "=";
    case 2:
      return s + "==";
    case 3:
      return s + "===";
  }
  return s;
}

/**
 * @param {string} s
 * @returns {string}
 */
export function b64EncodeStandard(s) {
  let res = Base64.encode(s, false /* url safe */);
  return b64pad(res);
}

/**
 * @param {string} s
 * @returns {string}
 */
export function b64EncodeURLSafe(s) {
  let res = Base64.encode(s, true /* url safe */);
  return b64pad(res);
}

/**
 * @param {string} s
 * @returns {string}
 */
export function b64EncodeHtmlImage(s) {
  let res = b64EncodeStandard(s);
  res = `<img src="data:image/py;base64,${res}" />`;
  return res;
}

/**
 * @param {string} s
 * @returns {string}
 */
export function b64Decode(s) {
  let res = Base64.decode(s);
  return res;
}

const hexTable = new TextEncoder().encode("0123456789ABCDEF");
const space = " ".charCodeAt(0); // stupid auto-formatter
/**
 * @param {string} s
 * @returns {string}
 */
export function strToHex(s) {
  let bytes = new TextEncoder().encode(s);
  let n = len(bytes);
  let dst = new Uint8Array(n * 3);
  let i = 0;
  for (let b of bytes) {
    dst[i] = hexTable[b >> 4];
    dst[i + 1] = hexTable[b & 0x0f];
    dst[i + 2] = space;
    i += 3;
  }
  return new TextDecoder().decode(dst);
}

/**
 * @param {string} s
 * @returns {string}
 */
export function b64DecodeAsHex(s) {
  let res = b64Decode(s);
  return strToHex(res);
}
