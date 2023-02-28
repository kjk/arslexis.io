import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, lineNumbers } from "@codemirror/view";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentUnit,
} from "@codemirror/language";
import { history, historyKeymap } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import {
  keymap,
  highlightSpecialChars,
  highlightWhitespace,
  highlightTrailingWhitespace,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  placeholder as placeholderExt,
} from "@codemirror/view";
import {
  IDM_VIEW_HIGHLIGHTCURRENTLINE_FRAME,
  IDM_VIEW_HIGHLIGHTCURRENTLINE_NONE,
} from "./notepad2/menu-notepad2";

export class CodeMirrorConfig {
  /** @type {EditorView} */
  editorView;

  constructor(editorView) {
    this.editorView = editorView;
  }

  readOnlyCompartment = new Compartment();
  /**
   * @param {boolean} readOnly
   */
  makeReadOnly(readOnly) {
    const v = EditorState.readOnly.of(readOnly);
    return this.readOnlyCompartment.of(v);
  }
  /**
   * @param {boolean} readOnly
   */
  updateReadOnly(readOnly) {
    const v = EditorState.readOnly.of(readOnly);
    this.editorView.dispatch({
      effects: this.readOnlyCompartment.reconfigure(v),
    });
  }

  wordWrapCompartment = new Compartment();
  makeWordWrap(wordWrap) {
    const v = wordWrap ? EditorView.lineWrapping : [];
    return this.wordWrapCompartment.of(v);
  }
  updateWordWrap(wordWrap) {
    const v = wordWrap ? EditorView.lineWrapping : [];
    this.editorView.dispatch({
      effects: this.wordWrapCompartment.reconfigure(v),
    });
  }

  lineNumbersCompartment = new Compartment();
  makeLineNumbers(showLineNumbers) {
    const v = showLineNumbers ? lineNumbers() : [];
    return this.lineNumbersCompartment.of(v);
  }
  updateLineNumbersState(showLineNumbers) {
    const v = showLineNumbers ? lineNumbers() : [];
    this.editorView.dispatch({
      effects: this.lineNumbersCompartment.reconfigure(v),
    });
  }

  visualBraceMatchingCompartment = new Compartment();
  makeVisualBraceMatching(visualBraceMatching) {
    const v = visualBraceMatching ? bracketMatching() : [];
    return this.visualBraceMatchingCompartment.of(v);
  }
  updateVisualBraceMatching(flag) {
    const v = flag ? bracketMatching() : [];
    this.editorView.dispatch({
      effects: this.visualBraceMatchingCompartment.reconfigure(v),
    });
  }

  enableMultipleSelectionCompartment = new Compartment();
  makeMultipleSelection(multipleSel) {
    const v = EditorState.allowMultipleSelections.of(multipleSel);
    return this.enableMultipleSelectionCompartment.of(v);
  }
  updateEnableMultipleSelection(flag) {
    const v = EditorState.allowMultipleSelections.of(flag);
    this.editorView.dispatch({
      effects: this.enableMultipleSelectionCompartment.reconfigure(v),
    });
  }

  lineSeparatorCompartment = new Compartment();
  makeLineSeparator(lineSeparator) {
    const v = EditorState.lineSeparator.of(lineSeparator);
    return this.lineSeparatorCompartment.of(v);
  }

  updateLineSeparator(lineSeparator) {
    const v = EditorState.lineSeparator.of(lineSeparator);
    this.editorView.dispatch({
      effects: this.lineSeparatorCompartment.reconfigure(v),
    });
  }

  showWhitespaceCompartment = new Compartment();
  makeShowWhiteSpace(showWhitespace) {
    const v = showWhitespace ? highlightWhitespace() : [];
    return this.showWhitespaceCompartment.of(v);
  }
  updateShowWhitespace(flag) {
    const v = flag ? highlightWhitespace() : [];
    this.editorView.dispatch({
      effects: this.showWhitespaceCompartment.reconfigure(v),
    });
  }

  showTrailingWhitespaceCompartment = new Compartment();
  makeShowTrailingWhitespace(showTrailingWhitespace) {
    const v = showTrailingWhitespace ? highlightTrailingWhitespace() : [];
    return this.showTrailingWhitespaceCompartment.of(v);
  }
  updateShowTrailingWhitespace(flag) {
    const v = flag ? highlightTrailingWhitespace() : [];
    this.editorView.dispatch({
      effects: this.showTrailingWhitespaceCompartment.reconfigure(v),
    });
  }

  tabSizeCompartment = new Compartment();
  makeTabSize(tabSize) {
    let v = EditorState.tabSize.of(tabSize);
    return this.tabSizeCompartment.of(v);
  }
  updateTabSize(ts) {
    const v = EditorState.tabSize.of(ts);
    this.editorView.dispatch({
      effects: this.tabSizeCompartment.reconfigure(v),
    });
  }

  tabsCompartment = new Compartment();
  makeTabState(tabsAsSpaces, tabSpaces) {
    const indentChar = tabsAsSpaces ? " ".repeat(tabSpaces) : "\t";
    const v = indentUnit.of(indentChar);
    return this.tabsCompartment.of(v);
  }
  updateTabsState(tabsAsSpaces, tabSpaces) {
    const indentChar = tabsAsSpaces ? " ".repeat(tabSpaces) : "\t";
    const v = indentUnit.of(indentChar);
    this.editorView.dispatch({
      effects: this.tabsCompartment.reconfigure(v),
    });
  }

  lineHighlightTypeCompartment = new Compartment();
  activeLineAltCSS = `.cm-activeLine {
    outline: 1px dotted gray;
    outline-offset: -3px;
    background-color: transparent !important;
}`;
  /** @type {HTMLStyleElement} */
  activeLineCSSElement = null;
  makeLineHighlight(lineHighlightType) {
    // TODO: only on mount
    if (!this.activeLineCSSElement) {
      this.activeLineCSSElement = document.createElement("style");
      this.activeLineCSSElement.innerHTML = this.activeLineAltCSS;
      // sheet.innerHTML = ".cm-activeLine {background-color: #ffffa5 !important}";
      document.body.appendChild(this.activeLineCSSElement);
    }
    // TODO: use own value instead of IDM_VIEW_HIGHLIGHTCURRENTLINE_NONE etc.
    const v =
      lineHighlightType === IDM_VIEW_HIGHLIGHTCURRENTLINE_NONE
        ? []
        : highlightActiveLine();
    this.activeLineCSSElement.disabled =
      lineHighlightType != IDM_VIEW_HIGHLIGHTCURRENTLINE_FRAME;
    return this.lineHighlightTypeCompartment.of(v);
  }
  updateLineHighlightType(lht) {
    this.activeLineCSSElement.disabled =
      lht != IDM_VIEW_HIGHLIGHTCURRENTLINE_FRAME;
    const v =
      lht === IDM_VIEW_HIGHLIGHTCURRENTLINE_NONE ? [] : highlightActiveLine();
    // TODO: for IDM_VIEW_HIGHLIGHTCURRENTLINE_BACK should be
    // yellow background but for that we should rather change the theme
    this.editorView.dispatch({
      effects: this.lineHighlightTypeCompartment.reconfigure(v),
    });
  }
}
