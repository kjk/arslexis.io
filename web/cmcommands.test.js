// import { EditorState } from "@codemirror/state";
import { describe, it } from "vitest";
import ist from "ist";
import { prstr } from "./testhelpers";
import { runCmd, mkState, runCmd2 } from "./cmtesthelper";
import {
  iterLines,
  deleteLeadingWhitespace,
  deleteTrailingWhitespace,
  padWithSpaces,
  strCompressWS,
  deleteFirstChar,
  deleteLastChar,
  duplicateSelection,
  mergeBlankLines,
  removeBlankLines,
  encloseSelection,
} from "./cmcommands";

// let exts = [EditorState.readOnly.of(false)];

function prstrNonEq(got, want) {
  if (got !== want) {
    console.log("want:", prstr(want));
    console.log("got :", prstr(got));
  }
}

describe("iterLines", () => {
  function t(s, lines) {
    let state = mkState(s);
    let i = 0;
    for (let got of iterLines(state.doc.iter())) {
      let want = lines[i];
      ist(got[0], want[0]);
      prstrNonEq(got[1], want[1]);
      ist(got[1], want[1]);
      i++;
    }
  }
  it("iterLines", () => {
    t("\n\nfoo\n", [
      [0, ""],
      [1, ""],
      [2, "foo"],
      [5, ""],
    ]);
    t("  ", [[0, "  "]]);
    t("  foo", [[0, "  foo"]]);
    t("a\nbc", [
      [0, "a"],
      [2, "bc"],
    ]);
    t("a\r\nbc", [
      [0, "a"],
      [2, "bc"],
    ]);
    t("a\rbc", [
      [0, "a"],
      [2, "bc"],
    ]);
    t("a\r\rbc", [
      [0, "a"],
      [2, ""],
      [3, "bc"],
    ]);
    t("a\n \nbc", [
      [0, "a"],
      [2, " "],
      [4, "bc"],
    ]);
    t("a\n \nbc\r\nl", [
      [0, "a"],
      [2, " "],
      [4, "bc"],
      [7, "l"],
    ]);
  });
});

function tt(from, to, cmd) {
  let got = runCmd(from, cmd);
  prstrNonEq(got, to);
  ist(got, to);
}

describe("deleteLeadingWhitespace", () => {
  function t(from, to) {
    tt(from, to, deleteLeadingWhitespace);
  }

  it("deleteLeadingWhitespace", () => {
    t("", "|");
    t("  ", "|");
    t("  foo", "|foo");
    t("  foo  ", "|foo  ");
    t("  f  oo  ", "|f  oo  ");
    t("\t\tf  oo  ", "|f  oo  ");
    t("\t  \tf  oo  ", "|f  oo  ");
  });
});

describe("deleteTrailingWhitespace", () => {
  function t(from, to) {
    tt(from, to, deleteTrailingWhitespace);
  }

  it("deleteTrailingWhitespace", () => {
    t("", "|");
    t("  ", "|");
    t("foo  ", "|foo");
    t("  foo  ", "|  foo");
    t("  f  oo  ", "|  f  oo");
    t("f  oo  \t\t", "|f  oo");
    t("  oo\t  \tf  \t", "|  oo\t  \tf");
  });
});

describe("deleteFirstChar", () => {
  function t(from, to) {
    tt(from, to, deleteFirstChar);
  }

  it("deleteFirstChar", () => {
    t("", "|");
    t("ab", "|ab");
    t("<ab>", "<b>");
    t("<ab\nc\ndada>", "<b\n\nada>");
    t("glo<ab\nc\ndada>bal", "glo<b\n\nada>bal");
  });
});

describe("deleteLastChar", () => {
  function t(from, to) {
    tt(from, to, deleteLastChar);
  }

  it("deleteLastChar", () => {
    t("", "|");
    t("ab", "|ab");
    t("<ab>", "<a>");
    t("<ab\nc\ndada>", "<a\n\ndad>");
    t("glo<ab\nc\ndada>bal", "glo<a\n\ndad>bal");
  });
});

describe("duplicateSelection", () => {
  function t(from, to) {
    tt(from, to, duplicateSelection);
  }

  it("duplicateSelection", () => {
    t("", "|");
    t("ab", "|ab");
    t("<>ab", "|>ab");
    t("<ab>", "<ab>ab");
    t("<ab>\n<c>\ndad<a><>", "<ab>ab\n<c>c\ndad<a>a>");
  });
});

describe("mergeBlankLines", () => {
  function t(from, to) {
    tt(from, to, mergeBlankLines);
  }

  it("mergeBlankLines", () => {
    t("", "|");
    t("\n\nab\n\n\r\n\r\n\rcc4", "|\nab\n\ncc4");
    t("ab\n\n\ncc1", "|ab\n\ncc1");
    t("ab\r\r\r\rcc2", "|ab\n\ncc2");
    t("ab\n\n\r\n\r\n\rcc3", "|ab\n\ncc3");
    t("<ab\n\n\n\n\rcc>3a", "<ab\n\ncc>3a");
  });
});

describe("removeBlankLines", () => {
  function t(from, to) {
    tt(from, to, removeBlankLines);
  }

  it("removeBlankLines", () => {
    t("", "|");
    t("\n\nab\n\n\r\n\r\n\rcc4", "|ab\ncc4");
    t("ab\n\n\ncc1\n", "|ab\ncc1\n");
    t("ab\n\n\ncc1\n\n", "|ab\ncc1\n");
    t("ab\r\r\r\rcc2", "|ab\ncc2");
    t("ab\n\n\r\n\r\n\rcc3", "|ab\ncc3");
    t("<ab\n\n\n\n\rcc>3a", "<ab\ncc>3a");
    t("<ab\n\ncc>3a\n<c\n\n\nd>\n", "<ab\ncc>3a\n<c\nd>\n");
  });
});

describe("encloseSelection", () => {
  function t(from, before, after, to) {
    let got = runCmd2(from, encloseSelection, before, after);
    prstrNonEq(got, to);
    ist(got, to);
  }

  it("encloseSelection", () => {
    t("", "a", "b", "|ab");
    t("a<b>c", "ll", "", "all<b>c");
    t("a<b>c", "", "ll", "a<b>llc");
    t("a<b>c", "ll", "xx", "all<b>xxc");
  });
});

describe("padWithSpaces", () => {
  function t(from, to) {
    tt(from, to, padWithSpaces);
  }
  it("padWithSpaces", () => {
    t("f\nf ", "|f \nf ");
    t("f \nf  ", "|f  \nf  ");
    t("f \nf  \n", "|f  \nf  \n   ");
  });
});

describe("compressWhitespace", () => {
  it("strCompressWS", () => {
    function t(s, want) {
      let got = strCompressWS(s);
      prstrNonEq(got, want);
      ist(got, want);
    }
    t("", "");
    t(" ", " ");
    t("  ", " ");
    t("as  \t\nb", "as b");
    t("as  \t\nb\t\t", "as b ");
  });
});
