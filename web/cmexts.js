import { Compartment, EditorState } from "@codemirror/state";
import {
  EditorView,
  crosshairCursor,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  placeholder as placeholderExt,
  rectangularSelection,
} from "@codemirror/view";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";

import { indentUnit } from "@codemirror/language";
import { indentWithTab } from "@codemirror/commands";
import { lintKeymap } from "@codemirror/lint";

/** @typedef { import("@codemirror/state").Extension} Extension */

// (The superfluous function calls around the list of extensions work
// around current limitations in tree-shaking software.)

/// This is an extension value that just pulls together a number of
/// extensions that you might want in a basic editor. It is meant as a
/// convenient helper to quickly set up CodeMirror without installing
/// and importing a lot of separate packages.
///
/// Specifically, it includes...
///
///  - [the default command bindings](#commands.defaultKeymap)
///  - [line numbers](#view.lineNumbers)
///  - [special character highlighting](#view.highlightSpecialChars)
///  - [the undo history](#commands.history)
///  - [a fold gutter](#language.foldGutter)
///  - [custom selection drawing](#view.drawSelection)
///  - [drop cursor](#view.dropCursor)
///  - [multiple selections](#state.EditorState^allowMultipleSelections)
///  - [reindentation on input](#language.indentOnInput)
///  - [the default highlight style](#language.defaultHighlightStyle) (as fallback)
///  - [bracket matching](#language.bracketMatching)
///  - [bracket closing](#autocomplete.closeBrackets)
///  - [autocompletion](#autocomplete.autocompletion)
///  - [rectangular selection](#view.rectangularSelection) and [crosshair cursor](#view.crosshairCursor)
///  - [active line highlighting](#view.highlightActiveLine)
///  - [active line gutter highlighting](#view.highlightActiveLineGutter)
///  - [selection match highlighting](#search.highlightSelectionMatches)
///  - [search](#search.searchKeymap)
///  - [linting](#lint.lintKeymap)
///
/// (You'll probably want to add some language package to your setup
/// too.)
///
/// This extension does not allow customization. The idea is that,
/// once you decide you want to configure your editor more precisely,
/// you take this package's source (which is just a bunch of imports
/// and an array literal), copy it into your own code, and adjust it
/// as desired.
export const basicSetup = (() => [
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap,
  ]),
])();

export const basicSetup2 = (() => [
  // highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  // foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  // highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap,
  ]),
])();

// all extensions that can be reconfigured
export class EditorConfigurator {
  /** @type {EditorView} */
  editorView;
  /** @type {Extension[]} */
  exts = [];
  readOnlyCompartment = new Compartment();
  constructor() {
    this.exts = [this.readOnlyCompartment.of(EditorState.readOnly.of(false))];
  }
  setReadOnly(readOnly) {
    this.editorView.dispatch({
      effects: this.readOnlyCompartment.reconfigure(
        EditorState.readOnly.of(readOnly)
      ),
    });
  }
}
/**
 * @param {boolean} basic
 * @param {boolean} useTab
 * @param {number} tabSize
 * @param {boolean} lineWrapping
 * @param {string} placeholder
 * @param {boolean} editable
 * @returns {Extension[]}
 */
export function getBaseExtensions(
  basic,
  useTab,
  tabSize,
  lineWrapping,
  placeholder,
  editable
) {
  /** @type {Extension[]} */
  const res = [
    indentUnit.of(" ".repeat(tabSize)),
    EditorView.editable.of(editable),
  ];

  if (basic) res.push(basicSetup);
  if (useTab) res.push(keymap.of([indentWithTab]));
  if (placeholder) res.push(placeholderExt(placeholder));
  if (lineWrapping) res.push(EditorView.lineWrapping);

  return res;
}

/**
 * @param {import("@codemirror/view").EditorView} editorView
 * @param {Compartment} readOnlyCompartment
 * @param {boolean} readOnly
 */
export function editorViewSetReadOnly(
  editorView,
  readOnlyCompartment,
  readOnly
) {
  editorView.dispatch({
    effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
  });
}

/**
 * @param {*} theme
 * @param {*} styles
 * @returns {Extension[]}
 */
export function getTheme(theme, styles) {
  /** @type {Extension[]} */
  const extensions = [];
  if (styles) extensions.push(EditorView.theme(styles));
  if (theme) extensions.push(theme);
  return extensions;
}
