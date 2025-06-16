/** @typedef { import("@codemirror/view").KeyBinding} KeyBinding */
/** @typedef { import("@codemirror/state").Extension} Extension */
/** @typedef { import("./Settings").Settings} Settings */

import { EditorView } from "codemirror";
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  highlightActiveLineGutter,
  highlightSpecialChars,
  rectangularSelection,
} from "@codemirror/view";
import {
  history,
  historyKeymap,
  indentLess,
  indentMore,
  cursorSyntaxLeft,
  selectSyntaxLeft,
  cursorSyntaxRight,
  selectSyntaxRight,
  moveLineUp,
  copyLineUp,
  moveLineDown,
  copyLineDown,
  simplifySelection,
  insertBlankLine,
  selectParentSyntax,
  indentSelection,
  deleteLine,
  cursorMatchingBracket,
  toggleComment,
  toggleBlockComment,
  standardKeymap,
} from "@codemirror/commands";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
  // foldKeymap,
} from "@codemirror/language";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { keymap, placeholder as placeholderExt } from "@codemirror/view";
import { lintKeymap } from "@codemirror/lint";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import {
  makeCodeFolding,
  makeIndentGuides,
  makeLang,
  makeLineHighlight,
  makeLineNumbers,
  makeLineSeparator,
  makeMultipleSelection,
  makeReadOnly,
  makeScrollPastEnd,
  makeShowTrailingWhitespace,
  makeShowWhiteSpace,
  makeTabSize,
  makeTabState,
  makeTheme,
  makeVisualBraceMatching,
  makeWordWrap,
} from "../CodeMirrorConfig";
import { toggleFoldAll } from "../cmcommands";

const placeholder =
  "Welcome to notepad2web - a web re-implementation of notepad2 Windows text editor.\nYou can save files in the browser (indexeddb) or open files from the file system (if supported by your browser).\nStart typing...";

/** @type {KeyBinding} */
const indentWithTab2 = {
  key: "Tab",
  run: indentMore,
  shift: indentLess,
};

let defaultKeymap2 = [
  {
    key: "Alt-ArrowLeft",
    mac: "Ctrl-ArrowLeft",
    run: cursorSyntaxLeft,
    shift: selectSyntaxLeft,
  },
  {
    key: "Alt-ArrowRight",
    mac: "Ctrl-ArrowRight",
    run: cursorSyntaxRight,
    shift: selectSyntaxRight,
  },

  { key: "Alt-ArrowUp", run: moveLineUp },
  { key: "Shift-Alt-ArrowUp", run: copyLineUp },

  { key: "Alt-ArrowDown", run: moveLineDown },
  { key: "Shift-Alt-ArrowDown", run: copyLineDown },

  { key: "Escape", run: simplifySelection },
  { key: "Mod-Enter", run: insertBlankLine },

  // { key: "Alt-l", mac: "Ctrl-l", run: selectLine },
  { key: "Mod-i", run: selectParentSyntax, preventDefault: true },

  { key: "Mod-[", run: indentLess },
  { key: "Mod-]", run: indentMore },
  { key: "Mod-Alt-\\", run: indentSelection },

  { key: "Shift-Mod-k", run: deleteLine },

  { key: "Shift-Mod-\\", run: cursorMatchingBracket },

  // must over-ride, it must be used by some other keymap
  // { key: "Alt-B", run: toggleFoldAll },

  { key: "Mod-/", run: toggleComment },
  { key: "Alt-A", run: toggleBlockComment },
];

/**
 * @param {Settings} settings
 * @param {Extension} lang
 * @returns
 */
export function makeConfig(settings, lang) {
  /** @type {Extension[]}*/
  let res = [
    EditorView.editable.of(true), // ???
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    makeVisualBraceMatching(settings.visualBraceMatching),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    makeLineHighlight(settings.lineHighlightType),
    highlightSelectionMatches(),
    keymap.of([
      ...defaultKeymap2,
      ...standardKeymap,
      ...closeBracketsKeymap,
      ...searchKeymap,
      ...historyKeymap,
      // ...foldKeymap,
      ...completionKeymap,
      ...lintKeymap,
    ]),
    keymap.of([indentWithTab2]),
    placeholderExt(placeholder),
    makeTabState(settings.tabsAsSpaces, settings.tabSpaces),
    makeTabSize(settings.tabSize),
    makeReadOnly(settings.readOnly),
    makeLineSeparator(settings.lineSeparator),
    makeShowWhiteSpace(settings.showWhitespace),
    makeShowTrailingWhitespace(settings.showTrailingWhitespace),
    makeWordWrap(settings.wordWrap),
    makeMultipleSelection(settings.enableMultipleSelection),
    makeLineNumbers(settings.showLineNumbers),
    makeIndentGuides(settings.showIndentGuides),
    makeCodeFolding(settings.showCodeFolding),
    makeScrollPastEnd(settings.scrollPastEnd),
    makeTheme(settings.theme),
    makeLang(lang),
  ];
  return res;
}
