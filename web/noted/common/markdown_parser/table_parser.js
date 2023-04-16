import { tags as t } from "../deps.js";
function parseRow(cx, line, startI = 0, elts, offset = 0) {
  let count = 0,
    first = true,
    cellStart = -1,
    cellEnd = -1,
    esc = false;
  let parseCell = () => {
    elts.push(
      cx.elt(
        "TableCell",
        offset + cellStart,
        offset + cellEnd,
        cx.parser.parseInline(
          line.slice(cellStart, cellEnd),
          offset + cellStart
        )
      )
    );
  };
  let inWikilink = false;
  for (let i = startI; i < line.length; i++) {
    let next = line.charCodeAt(i);
    if (next === 91 && line.charAt(i + 1) === "[") {
      inWikilink = true;
    } else if (next === 93 && line.charAt(i - 1) === "]" && inWikilink) {
      inWikilink = false;
    }
    if (next == 124 && !esc && !inWikilink) {
      if (!first || cellStart > -1) count++;
      first = false;
      if (elts) {
        if (cellStart > -1) parseCell();
        elts.push(cx.elt("TableDelimiter", i + offset, i + offset + 1));
      }
      cellStart = cellEnd = -1;
    } else if (esc || (next != 32 && next != 9)) {
      if (cellStart < 0) cellStart = i;
      cellEnd = i + 1;
    }
    esc = !esc && next == 92;
  }
  if (cellStart > -1) {
    count++;
    if (elts) parseCell();
  }
  return count;
}
function hasPipe(str, start) {
  for (let i = start; i < str.length; i++) {
    let next = str.charCodeAt(i);
    if (next == 124) return true;
    if (next == 92) i++;
  }
  return false;
}
const delimiterLine = /^\|?(\s*:?-+:?\s*\|)+(\s*:?-+:?\s*)?$/;
class TableParser {
  constructor() {
    this.rows = null;
  }
  nextLine(cx, line, leaf) {
    if (this.rows == null) {
      this.rows = false;
      let lineText;
      if (
        (line.next == 45 || line.next == 58 || line.next == 124) &&
        delimiterLine.test((lineText = line.text.slice(line.pos)))
      ) {
        let firstRow = [],
          firstCount = parseRow(cx, leaf.content, 0, firstRow, leaf.start);
        if (firstCount == parseRow(cx, lineText, line.pos)) {
          this.rows = [
            cx.elt(
              "TableHeader",
              leaf.start,
              leaf.start + leaf.content.length,
              firstRow
            ),
            cx.elt(
              "TableDelimiter",
              cx.lineStart + line.pos,
              cx.lineStart + line.text.length
            ),
          ];
        }
      }
    } else if (this.rows) {
      let content = [];
      parseRow(cx, line.text, line.pos, content, cx.lineStart);
      this.rows.push(
        cx.elt(
          "TableRow",
          cx.lineStart + line.pos,
          cx.lineStart + line.text.length,
          content
        )
      );
    }
    return false;
  }
  finish(cx, leaf) {
    if (!this.rows) return false;
    cx.addLeafElement(
      leaf,
      cx.elt("Table", leaf.start, leaf.start + leaf.content.length, this.rows)
    );
    return true;
  }
}
export const Table = {
  defineNodes: [
    { name: "Table", block: true },
    { name: "TableHeader", style: { "TableHeader/...": t.heading } },
    "TableRow",
    { name: "TableCell", style: t.content },
    { name: "TableDelimiter", style: t.processingInstruction },
  ],
  parseBlock: [
    {
      name: "Table",
      leaf(_, leaf) {
        return hasPipe(leaf.content, 0) ? new TableParser() : null;
      },
      endLeaf(cx, line, leaf) {
        if (
          leaf.parsers.some((p) => p instanceof TableParser) ||
          !hasPipe(line.text, line.basePos)
        )
          return false;
        let next = cx.scanLine(cx.absoluteLineEnd + 1).text;
        return (
          delimiterLine.test(next) &&
          parseRow(cx, line.text, line.basePos) ==
            parseRow(cx, next, line.basePos)
        );
      },
      before: "SetextHeading",
    },
  ],
};
