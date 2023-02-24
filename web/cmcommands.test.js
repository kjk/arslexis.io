// import { EditorState } from "@codemirror/state";
import { describe, it } from "vitest";
import ist from "ist";
import { streq } from "./testhelpers";
import { runCmd, mkState, runCmd2 } from "./cmtesthelper";
import {
  iterLines,
  deleteLeadingWhitespace,
  deleteTrailingWhitespace,
  padWithSpaces,
  deleteFirstChar,
  deleteLastChar,
  duplicateSelection,
  mergeBlankLines,
  removeBlankLines,
  encloseSelection,
  mergeDuplicateLines,
  deleteDuplicateLines,
  compressWhitespace,
  transposeLines,
  duplicateLine,
} from "./cmcommands";

// let exts = [EditorState.readOnly.of(false)];

describe("iterLines", () => {
  function t(s, lines) {
    let state = mkState(s);
    let i = 0;
    for (let got of iterLines(state.doc.iter())) {
      let want = lines[i];
      ist(got[0], want[0]);
      streq(got[1], want[1]);
      streq(got[2], want[2]);
      i++;
    }
  }
  it("iterLines", () => {
    t("\n\nfoo\n", [
      [0, "", "\n"],
      [1, "", "\n"],
      [2, "foo", "\n"],
      [6, "", ""],
    ]);
    t("  ", [[0, "  ", ""]]);
    t("  foo", [[0, "  foo", ""]]);
    t("a\nbc", [
      [0, "a", "\n"],
      [2, "bc", ""],
    ]);
    t("a\r\nbc", [
      [0, "a", "\n"],
      [2, "bc", ""],
    ]);
    t("a\rbc", [
      [0, "a", "\n"],
      [2, "bc", ""],
    ]);
    t("a\r\rbc", [
      [0, "a", "\n"],
      [2, "", "\n"],
      [3, "bc", ""],
    ]);
    t("a\n \nbc", [
      [0, "a", "\n"],
      [2, " ", "\n"],
      [4, "bc", ""],
    ]);
    t("a\n \nbc\r\nl", [
      [0, "a", "\n"],
      [2, " ", "\n"],
      [4, "bc", "\n"],
      [7, "l", ""],
    ]);
  });
});

function tt(from, to, cmd) {
  let got = runCmd(from, cmd);
  streq(got, to);
}

describe("commands", () => {
  it("deleteLeadingWhitespace", () => {
    function t(from, to) {
      tt(from, to, deleteLeadingWhitespace);
    }

    t("", "|");
    t("  ", "|");
    t("  foo", "|foo");
    t("  foo  ", "|foo  ");
    t("  f  oo  ", "|f  oo  ");
    t("\t\tf  oo  ", "|f  oo  ");
    t("\t  \tf  oo  ", "|f  oo  ");
  });

  it("deleteTrailingWhitespace", () => {
    function t(from, to) {
      tt(from, to, deleteTrailingWhitespace);
    }

    t("", "|");
    t("  ", "|");
    t("foo  ", "|foo");
    t("  foo  ", "|  foo");
    t("  f  oo  ", "|  f  oo");
    t("f  oo  \t\t", "|f  oo");
    t("  oo\t  \tf  \t", "|  oo\t  \tf");
  });

  it("deleteFirstChar", () => {
    function t(from, to) {
      tt(from, to, deleteFirstChar);
    }
    t("", "|");
    t("ab", "|ab");
    t("<ab>", "<b>");
    t("<ab\nc\ndada>", "<b\n\nada>");
    t("glo<ab\nc\ndada>bal", "glo<b\n\nada>bal");
  });

  it("deleteLastChar", () => {
    function t(from, to) {
      tt(from, to, deleteLastChar);
    }

    t("", "|");
    t("ab", "|ab");
    t("<ab>", "<a>");
    t("<ab\nc\ndada>", "<a\n\ndad>");
    t("glo<ab\nc\ndada>bal", "glo<a\n\ndad>bal");
  });

  it("duplicateSelection", () => {
    function t(from, to) {
      tt(from, to, duplicateSelection);
    }

    t("", "|");
    t("ab", "|ab");
    t("<>ab", "|>ab");
    t("<ab>", "<ab>ab");
    t("<ab>\n<c>\ndad<a><>", "<ab>ab\n<c>c\ndad<a>a>");
  });

  it("mergeBlankLines", () => {
    function t(from, to) {
      tt(from, to, mergeBlankLines);
    }

    t("", "|");
    t("\n\nab\n\n\r\n\r\n\rcc4", "|\nab\n\ncc4");
    t("ab\n\n\ncc1", "|ab\n\ncc1");
    t("ab\r\r\r\rcc2", "|ab\n\ncc2");
    t("ab\n\n\r\n\r\n\rcc3", "|ab\n\ncc3");
    t("<ab\n\n\n\n\rcc>3a", "<ab\n\ncc>3a");
  });

  it("removeBlankLines", () => {
    function t(from, to) {
      tt(from, to, removeBlankLines);
    }

    t("", "|");
    t("\n\nab\n\n\r\n\r\n\rcc4", "|ab\ncc4");
    t("ab\n\n\ncc1\n", "|ab\ncc1\n");
    t("ab\n\n\ncc1\n\n", "|ab\ncc1\n");
    t("ab\r\r\r\rcc2", "|ab\ncc2");
    t("ab\n\n\r\n\r\n\rcc3", "|ab\ncc3");
    t("<ab\n\n\n\n\rcc>3a", "<ab\ncc>3a");
    t("<ab\n\ncc>3a\n<c\n\n\nd>\n", "<ab\ncc>3a\n<c\nd>\n");
  });

  it("encloseSelection", () => {
    function t(from, before, after, to) {
      let got = runCmd2(from, encloseSelection, before, after);
      streq(got, to);
    }
    t("", "a", "b", "|ab");
    t("a<b>c", "ll", "", "all<b>c");
    t("a<b>c", "", "ll", "a<b>llc");
    t("a<b>c", "ll", "xx", "all<b>xxc");
  });

  it("mergeDuplicateLines", () => {
    function t(from, to) {
      tt(from, to, mergeDuplicateLines);
    }
    t("", "|");
    t("a\n<a\na\na\n>", "a\n<a\n>");
    t("a\n<ab\nab\nd\nab\n>dd", "a\n<ab\nd\n>dd");
    t("<ab\nab\nab>", "<ab\n>");
  });

  it("deleteDuplicateLines", () => {
    function t(from, to) {
      tt(from, to, deleteDuplicateLines);
    }
    t("", "|");
    t(
      `<
foo
foo

asd
foo>`,
      "<asd\n>"
    );
  });

  it("padWithSpaces", () => {
    function t(from, to) {
      tt(from, to, padWithSpaces);
    }
    t("f\nf ", "|f \nf ");
    t("f \nf  ", "|f  \nf  ");
    t("f \nf  \n", "|f  \nf  \n   ");
  });

  it("compressWhitespace", () => {
    function t(from, to) {
      tt(from, to, compressWhitespace);
    }
    t("fo   \nf ", "|fo \nf ");
    t("\t\tf \t \nf  ", "| f \nf ");
    t("f \t \nf  \n", "|f \nf \n");
    t("<fo   \nf >", "<fo \nf >");
    t("<\t\tf \t \nf  >", "< f \n>f "); // TODO: why?
    t("<f \t \nf  \n>", "<f \nf \n>");
  });

  it("transposeLines", () => {
    function t(from, to) {
      tt(from, to, transposeLines);
    }
    t("aa\nbb\nc|c", "aa\ncc\n|bb");
    t("aa\nb|b\ncc", "bb\n|aa\ncc");
    t("a|a\nbb\ncc", "a|a\nbb\ncc");
  });

  it("duplicateLine", () => {
    function t(from, to) {
      tt(from, to, duplicateLine);
    }
    t("a|a\nbb\ncc", "a|a\naa\nbb\ncc");
    t("aa\n|bb\ncc", "aa\n|bb\nbb\ncc");
    t("aa\nbb\ncc|", "aa\nbb\ncc|\ncc");
  });
});
