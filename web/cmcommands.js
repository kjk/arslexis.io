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
 * @param {{state: EditorState, dispatch: any}} arg
 */
export function deleteLeadingWhitespace({ state, dispatch }) {
  if (state.readOnly) return false;
  let changes = [];

  /**
   * @param {TextIterator} iter
   * @param {number} start
   */
  function delIter(iter, start = 0) {
    for (let pos = 0, prev = ""; ; ) {
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
      pos += iter.value.length;
    }
  }
  let doc = state.doc;
  let sel = state.selection;
  if (isEmptySelection(sel)) {
    delIter(doc.iter());
  } else {
    for (let range of sel.ranges) {
      let { from, to } = range;
      delIter(doc.iterRange(from, to), from);
    }
  }
  if (!changes.length) return false;
  dispatch(state.update({ changes, userEvent: "delete.eadingwhitespace" }));
  return true;
}

/**
 * @param {{state: EditorState, dispatch: any}} arg
 */
export function deleteTrailingWhitespace({ state, dispatch }) {
  if (state.readOnly) return false;
  let changes = [];
  /**
   * @param {TextIterator} iter
   * @param {number} start
   */
  function delIter(iter, start = 0) {
    for (let pos = 0, prev = ""; ; ) {
      iter.next();
      if (iter.lineBreak || iter.done) {
        let trailing = prev.search(/\s+$/);
        if (trailing > -1) {
          let from = pos + start - (prev.length - trailing);
          let to = pos + start;
          changes.push({ from: from, to: to });
        }
        if (iter.done) break;
        prev = "";
      } else {
        prev = iter.value;
      }
      pos += iter.value.length;
    }
  }
  let doc = state.doc;
  let sel = state.selection;
  if (isEmptySelection(sel)) {
    delIter(doc.iter());
  } else {
    for (let range of sel.ranges) {
      let { from, to } = range;
      delIter(doc.iterRange(from, to), from);
    }
  }
  if (!changes.length) return false;
  dispatch(state.update({ changes, userEvent: "delete.trailingwhitespace" }));
  return true;
}

/**
 * dir > 0 : delete end of line
 * dir < 0 : delete start of line
 * @param {TextIterator} iter
 * @param {number} start
 * @param {number} dir
 */
function delCharIter(changes, iter, start, dir) {
  for (let pos = 0, prev = ""; ; ) {
    iter.next();
    if (iter.lineBreak || iter.done) {
      let from = start + pos - prev.length;
      if (dir > 0) {
        from = from + prev.length - 1;
        if (iter.done) {
          // TODO: shouldn't delete last if not at end of line
          // check that from + 1 is end of this line. bail if not
        }
      }
      let to = from + 1;
      changes.push({ from, to });
      if (iter.done) break;
      prev = "";
    } else {
      prev = iter.value;
    }
    pos += iter.value.length;
  }
}

/**
 * @param {{state: EditorState, dispatch: any}} arg
 */
export function deleteFirstChar({ state, dispatch }) {
  if (state.readOnly) return false;
  let changes = [];

  let doc = state.doc;
  let sel = state.selection;
  if (isEmptySelection(sel)) {
    let from = sel.ranges[0].from;
    let line = doc.lineAt(from);
    if (line.length > 0) {
      from = line.from;
      let to = from + 1;
      changes.push({ from, to });
    }
  } else {
    for (let range of sel.ranges) {
      let { from, to } = range;
      delCharIter(changes, doc.iterRange(from, to), from, -1);
    }
  }
  if (!changes.length) return false;
  dispatch(state.update({ changes, userEvent: "delete.firstchar" }));
  return true;
}

/**
 * @param {{state: EditorState, dispatch: any}} arg
 */
export function deleteLastChar({ state, dispatch }) {
  if (state.readOnly) return false;
  let changes = [];
  let doc = state.doc;
  let sel = state.selection;
  if (isEmptySelection(sel)) {
    let from = sel.ranges[0].from;
    let line = doc.lineAt(from);
    if (line.length > 0) {
      from = line.from + line.length - 1;
      let to = from + 1;
      console.log("deleteLastChar: from:", from, "to:", to);
      changes.push({ from, to });
    }
  } else {
    for (let range of sel.ranges) {
      let { from, to } = range;
      delCharIter(changes, doc.iterRange(from, to), from, 1);
    }
  }
  if (!changes.length) return false;
  dispatch(state.update({ changes, userEvent: "delete.lastchar" }));
  return true;
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
 * for each line in iter, returns line position and length
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
 * if more than one blank line,
 * @param {{state: EditorState, dispatch: any}} arg
 */
export function mergeBlankLines({ state, dispatch }) {
  if (state.readOnly) return false;
  let changes = [];
  let doc = state.doc;
  let docLen = doc.length;
  let sel = state.selection;
  function mergeBlanksIter(iter, start = 0) {
    let ll = collectLineLengths(iter);
    let nLines = len(ll) / 2;
    let prevWasBlank = false;
    for (let i = 0; i < nLines; i++) {
      let llen = ll[i * 2 + 1];
      if (llen == 0) {
        if (prevWasBlank) {
          let from = start + ll[i * 2];
          let to = Math.min(from + 1, docLen);
          changes.push({ from, to });
        }
        prevWasBlank = true;
      } else {
        prevWasBlank = false;
      }
    }
  }
  if (isEmptySelection(sel)) {
    mergeBlanksIter(doc.iter());
  } else {
    for (let range of sel.ranges) {
      let { from, to } = range;
      let iter = doc.iterRange(from, to);
      mergeBlanksIter(iter, from);
    }
  }
  if (!changes.length) return false;
  dispatch(state.update({ changes, userEvent: "input.mergeblanklines" }));
  return true;
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
  let changes = [];

  /** @type {Map<string, undefined>} */
  let seenLines = new Map();

  let doc = state.doc;
  let sel = state.selection;
  let docLen = doc.length;

  /**
   * @param {TextIterator} iter
   * @param {number} start
   */
  function delIter(iter, start = 0) {
    // debugger;
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
