import {
  EditorView,
  lineNumbers,
  scrollPastEnd,
  highlightWhitespace,
  highlightTrailingWhitespace,
  highlightActiveLine,
} from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { foldGutter, bracketMatching, indentUnit } from "@codemirror/language";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { oneDarkTheme } from "@codemirror/theme-one-dark";
import * as m from "./notepad2/menu-notepad2";
import { throwIf } from "./util";

let editorView;

export function setConfigEditorView(ev) {
  editorView = ev;
}

const readOnlyCompartment = new Compartment();
/**
 * @param {boolean} readOnly
 */
export function makeReadOnly(readOnly) {
  const v = EditorState.readOnly.of(readOnly);
  return readOnlyCompartment.of(v);
}
/**
 * @param {boolean} readOnly
 */
export function updateReadOnly(readOnly) {
  if (!editorView) return;
  const v = EditorState.readOnly.of(readOnly);
  editorView.dispatch({
    effects: readOnlyCompartment.reconfigure(v),
  });
}

const wordWrapCompartment = new Compartment();
export function makeWordWrap(wordWrap) {
  const v = wordWrap ? EditorView.lineWrapping : [];
  return wordWrapCompartment.of(v);
}
export function updateWordWrap(wordWrap) {
  if (!editorView) return;
  const v = wordWrap ? EditorView.lineWrapping : [];
  editorView.dispatch({
    effects: wordWrapCompartment.reconfigure(v),
  });
}

let lineNumbersCompartment = new Compartment();
export function makeLineNumbers(showLineNumbers) {
  const v = showLineNumbers ? lineNumbers() : [];
  return lineNumbersCompartment.of(v);
}
export function updateLineNumbersState(showLineNumbers) {
  if (!editorView) return;
  const v = showLineNumbers ? lineNumbers() : [];
  editorView.dispatch({
    effects: lineNumbersCompartment.reconfigure(v),
  });
}

const visualBraceMatchingCompartment = new Compartment();
export function makeVisualBraceMatching(visualBraceMatching) {
  const v = visualBraceMatching ? bracketMatching() : [];
  return visualBraceMatchingCompartment.of(v);
}
export function updateVisualBraceMatching(visualBraceMatching) {
  if (!editorView) return;
  const v = visualBraceMatching ? bracketMatching() : [];
  editorView.dispatch({
    effects: visualBraceMatchingCompartment.reconfigure(v),
  });
}

// possibilities:
// "▶", "▼"
// "+", "−"
// "⊞", "⊟"
let foldGutterExt = foldGutter({
  closedText: "⊞",
  openText: "⊟",
});

const codeFoldingCompartment = new Compartment();
export function makeCodeFolding(codeFolding) {
  const v = codeFolding ? foldGutterExt : [];
  return codeFoldingCompartment.of(v);
}
export function updateCodeFolding(codeFolding) {
  if (!editorView) return;
  const v = codeFolding ? foldGutterExt : [];
  editorView.dispatch({
    effects: codeFoldingCompartment.reconfigure(v),
  });
}

const indentGuidesCompartment = new Compartment();
export function makeIndentGuides(indentGuides) {
  const v = indentGuides ? indentationMarkers() : [];
  return indentGuidesCompartment.of(v);
}
export function updateIndentGuides(indentGuides) {
  if (!editorView) return;
  const v = indentGuides ? indentationMarkers() : [];
  editorView.dispatch({
    effects: indentGuidesCompartment.reconfigure(v),
  });
}

const enableMultipleSelectionCompartment = new Compartment();
export function makeMultipleSelection(multipleSel) {
  const v = EditorState.allowMultipleSelections.of(multipleSel);
  return enableMultipleSelectionCompartment.of(v);
}
export function updateEnableMultipleSelection(flag) {
  if (!editorView) return;
  const v = EditorState.allowMultipleSelections.of(flag);
  editorView.dispatch({
    effects: enableMultipleSelectionCompartment.reconfigure(v),
  });
}

const lineSeparatorCompartment = new Compartment();
export function makeLineSeparator(lineSeparator) {
  const v = EditorState.lineSeparator.of(lineSeparator);
  return lineSeparatorCompartment.of(v);
}

export function updateLineSeparator(lineSeparator) {
  if (!editorView) return;
  const v = EditorState.lineSeparator.of(lineSeparator);
  editorView.dispatch({
    effects: lineSeparatorCompartment.reconfigure(v),
  });
}

const showWhitespaceCompartment = new Compartment();
export function makeShowWhiteSpace(showWhitespace) {
  const v = showWhitespace ? highlightWhitespace() : [];
  return showWhitespaceCompartment.of(v);
}
export function updateShowWhitespace(showWhitespace) {
  if (!editorView) return;
  const v = showWhitespace ? highlightWhitespace() : [];
  editorView.dispatch({
    effects: showWhitespaceCompartment.reconfigure(v),
  });
}

const showTrailingWhitespaceCompartment = new Compartment();
export function makeShowTrailingWhitespace(showTrailingWhitespace) {
  const v = showTrailingWhitespace ? highlightTrailingWhitespace() : [];
  return showTrailingWhitespaceCompartment.of(v);
}
export function updateShowTrailingWhitespace(showTrailingWhitespace) {
  if (!editorView) return;
  const v = showTrailingWhitespace ? highlightTrailingWhitespace() : [];
  editorView.dispatch({
    effects: showTrailingWhitespaceCompartment.reconfigure(v),
  });
}

const tabSizeCompartment = new Compartment();
export function makeTabSize(tabSize) {
  let v = EditorState.tabSize.of(tabSize);
  return tabSizeCompartment.of(v);
}
export function updateTabSize(tabSize) {
  if (!editorView) return;
  const v = EditorState.tabSize.of(tabSize);
  editorView.dispatch({
    effects: tabSizeCompartment.reconfigure(v),
  });
}

const tabsCompartment = new Compartment();
export function makeTabState(tabsAsSpaces, tabSpaces) {
  const indentChar = tabsAsSpaces ? " ".repeat(tabSpaces) : "\t";
  const v = indentUnit.of(indentChar);
  return tabsCompartment.of(v);
}
export function updateTabsState(tabsAsSpaces, tabSpaces) {
  if (!editorView) return;
  const indentChar = tabsAsSpaces ? " ".repeat(tabSpaces) : "\t";
  const v = indentUnit.of(indentChar);
  editorView.dispatch({
    effects: tabsCompartment.reconfigure(v),
  });
}

const lineHighlightTypeCompartment = new Compartment();
const activeLineAltCSS = `.cm-activeLine {
    outline: 1px dotted gray;
    outline-offset: -3px;
    background-color: transparent !important;
}`;
/** @type {HTMLStyleElement} */
let activeLineCSSElement = null;
export function makeLineHighlight(lineHighlightType) {
  // TODO: only on mount
  if (!activeLineCSSElement) {
    activeLineCSSElement = document.createElement("style");
    activeLineCSSElement.innerHTML = activeLineAltCSS;
    // sheet.innerHTML = ".cm-activeLine {background-color: #ffffa5 !important}";
    document.body.appendChild(activeLineCSSElement);
  }
  // TODO: use own value instead of IDM_VIEW_HIGHLIGHTCURRENTLINE_NONE etc.
  const v =
    lineHighlightType === m.IDM_VIEW_HIGHLIGHTCURRENTLINE_NONE
      ? []
      : highlightActiveLine();
  activeLineCSSElement.disabled =
    lineHighlightType != m.IDM_VIEW_HIGHLIGHTCURRENTLINE_FRAME;
  return lineHighlightTypeCompartment.of(v);
}
export function updateLineHighlightType(lht) {
  if (!editorView) return;
  activeLineCSSElement.disabled = lht != m.IDM_VIEW_HIGHLIGHTCURRENTLINE_FRAME;
  const v =
    lht === m.IDM_VIEW_HIGHLIGHTCURRENTLINE_NONE ? [] : highlightActiveLine();
  // TODO: for IDM_VIEW_HIGHLIGHTCURRENTLINE_BACK should be
  // yellow background but for that we should rather change the theme
  editorView.dispatch({
    effects: lineHighlightTypeCompartment.reconfigure(v),
  });
}

const langCompartment = new Compartment();
export function makeLang(lang) {
  if (!lang) {
    lang = [];
  }
  return langCompartment.of(lang);
}
export function updateLang(lang) {
  if (!editorView) return;
  if (!lang) {
    lang = [];
  }
  editorView.dispatch({
    // @ts-ignore
    effects: langCompartment.reconfigure(lang),
  });
}

const scrollPastEndCompartment = new Compartment();
export function makeScrollPastEnd(id) {
  let v;
  switch (id) {
    case m.IDM_VIEW_SCROLLPASTLASTLINE_ONE:
      v = scrollPastEnd();
      break;
    case m.IDM_VIEW_SCROLLPASTLASTLINE_NO:
      v = [];
      break;
    default:
      throwIf(true, `unsupported id ${id}`);
  }
  return scrollPastEndCompartment.of(v);
}
export function updateScrollPastEnd(id) {
  if (!editorView) return;
  const v = id === m.IDM_VIEW_SCROLLPASTLASTLINE_ONE ? scrollPastEnd() : [];
  editorView.dispatch({
    effects: scrollPastEndCompartment.reconfigure(v),
  });
}

export const themeNameDark = "oneDark";
export const themeNameDefault = "default";

const themeCompartment = new Compartment();
export function makeTheme(theme) {
  const v = theme === themeNameDark ? oneDarkTheme : [];
  return themeCompartment.of(v);
}
export function updateTheme(theme) {
  if (!editorView) return;
  const v = theme === themeNameDark ? oneDarkTheme : [];
  editorView.dispatch({
    effects: themeCompartment.reconfigure(v),
  });
}
