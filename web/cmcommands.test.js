// import { EditorState } from "@codemirror/state";
import { describe, it } from "vitest";
import ist from "ist";
import { prstr } from "./testhelpers";
import { runCmd, mkState } from "./cmtesthelper";
import {
  iterLines,
  deleteLeadingWhitespace,
  deleteTrailingWhitespace,
  padWithSpaces,
  strCompressWS,
} from "./cmcommands";

// let exts = [EditorState.readOnly.of(false)];

function prstrNonEq(got, want) {
  if (got !== want) {
    console.log("got :", prstr(got));
    console.log("want:", prstr(want));
  }
}

describe("iterLines", () => {
  function t(s, lines) {
    let state = mkState(s);
    let i = 0;
    for (let got of iterLines(state.doc.iter())) {
      let want = lines[i];
      prstrNonEq(got[1], want[1]);
      ist(got[0], want[0]);
      ist(got[1], want[1]);
      i++;
    }
  }
  it("iterLines", () => {
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

describe("deleteLeadingWhitespace", () => {
  function t(from, to) {
    let got = runCmd(from, deleteLeadingWhitespace);
    prstrNonEq(got, to);
    ist(got, to);
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
    let got = runCmd(from, deleteTrailingWhitespace);
    prstrNonEq(got, to);
    ist(got, to);
  }

  it("deleteLeadingWhitespace", () => {
    t("", "|");
    t("  ", "|");
    t("foo  ", "|foo");
    t("  foo  ", "|  foo");
    t("  f  oo  ", "|  f  oo");
    t("f  oo  \t\t", "|f  oo");
    t("  oo\t  \tf  \t", "|  oo\t  \tf");
  });
});

describe("padWithSpaces", () => {
  function t(from, to) {
    let got = runCmd(from, padWithSpaces);
    prstrNonEq(got, to);
    ist(got, to);
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
