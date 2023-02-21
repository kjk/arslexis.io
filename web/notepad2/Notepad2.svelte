<script context="module">
  /** @typedef { import("@codemirror/view").KeyBinding} KeyBinding */
  /** @typedef { import("@codemirror/state").Extension} Extension */
  /** @typedef { import("@codemirror/state").Transaction} Transaction */
  /** @typedef { import("@codemirror/language").LanguageSupport} LanguageSupport */
  /** @typedef {import("@codemirror/state").EditorSelection} EditorSelection */
  /** @typedef {import("@codemirror/state").SelectionRange} SelectionRange */
</script>

<script>
  import MenuBar from "../MenuBar.svelte";
  import {
    IDT_FILE_NEW,
    IDT_FILE_OPEN,
    IDT_FILE_BROWSE,
    IDT_FILE_SAVE,
    IDT_EDIT_UNDO,
    IDT_EDIT_REDO,
    IDT_EDIT_CUT,
    IDT_EDIT_COPY,
    IDT_EDIT_PASTE,
    IDT_EDIT_FIND,
    IDT_EDIT_REPLACE,
    IDT_VIEW_WORDWRAP,
    IDT_VIEW_ZOOMIN,
    IDT_VIEW_ZOOMOUT,
    IDT_VIEW_SCHEME,
    IDT_VIEW_SCHEMECONFIG,
    IDT_FILE_EXIT,
    IDT_FILE_SAVEAS,
    IDT_FILE_SAVECOPY,
    IDT_EDIT_DELETE,
    IDT_FILE_PRINT,
    IDT_FILE_OPENFAV,
    IDT_FILE_ADDTOFAV,
    IDT_VIEW_TOGGLEFOLDS,
    IDT_FILE_LAUNCH,
    IDT_VIEW_ALWAYSONTOP,
    CMD_CUSTOM_ACTION1,
    CMD_CUSTOM_ACTION2,
    CMD_ONLINE_SEARCH_BING,
    CMD_ONLINE_SEARCH_GOOGLE,
    CMD_ONLINE_SEARCH_WIKI,
    IDM_EDIT_CLEARCLIPBOARD,
    IDM_EDIT_CLEARDOCUMENT,
    IDM_EDIT_CONVERTLOWERCASE,
    IDM_EDIT_CONVERTSPACES,
    IDM_EDIT_CONVERTSPACES2,
    IDM_EDIT_CONVERTTABS,
    IDM_EDIT_CONVERTTABS2,
    IDM_EDIT_CONVERTUPPERCASE,
    IDM_EDIT_COPY,
    IDM_EDIT_COPYADD,
    IDM_EDIT_COPYALL,
    IDM_EDIT_CUT,
    IDM_EDIT_INVERTCASE,
    IDM_EDIT_NUM2BIN,
    IDM_EDIT_NUM2DEC,
    IDM_EDIT_NUM2HEX,
    IDM_EDIT_NUM2OCT,
    IDM_EDIT_PASTE,
    IDM_EDIT_REDO,
    IDM_EDIT_SELECTALL,
    IDM_EDIT_SENTENCECASE,
    IDM_EDIT_SWAP,
    IDM_EDIT_TITLECASE,
    IDM_EDIT_UNDO,
    IDM_FILE_NEW,
    IDM_FILE_NEWWINDOW2,
    IDM_FILE_OPEN,
    IDM_FILE_READONLY_MODE,
    IDM_FILE_SAVE,
    IDM_FILE_SAVEAS,
    IDM_HELP_ABOUT,
    IDM_HELP_FEATURE_REQUEST,
    IDM_HELP_PROJECT_HOME,
    IDM_HELP_REPORT_ISSUE,
    IDM_VIEW_LINENUMBERS,
    IDM_VIEW_WORDWRAP,
    IDM_VIEW_STATUSBAR,
    IDM_VIEW_TOOLBAR,
    mainMenuBar,
    IDM_FILE_SAVECOPY,
    IDM_VIEW_MENU,
    IDM_VIEW_TOGGLE_FULLSCREEN,
    IDM_EDIT_URLENCODE,
    IDM_EDIT_URLDECODE,
    IDM_EDIT_BASE64_ENCODE,
    IDM_EDIT_BASE64_SAFE_ENCODE,
    IDM_EDIT_BASE64_HTML_EMBEDDED_IMAGE,
    IDM_EDIT_BASE64_DECODE,
    IDM_EDIT_BASE64_DECODE_AS_HEX,
    IDM_EDIT_DELETE,
    IDM_EDIT_INDENT,
    IDM_EDIT_UNINDENT,
    IDM_LINEENDINGS_CRLF,
    IDM_LINEENDINGS_LF,
    IDM_LINEENDINGS_CR,
    IDM_VIEW_SHOWWHITESPACE,
    IDM_SET_MULTIPLE_SELECTION,
    IDM_VIEW_TABSASSPACES,
    IDM_EDIT_MOVELINEDOWN,
    IDM_EDIT_MOVELINEUP,
    IDM_EDIT_DELETELINELEFT,
    IDM_EDIT_DELETELINERIGHT,
    IDM_EDIT_TRIMLINES,
    IDM_EDIT_TRIMLEAD,
    IDM_EDIT_STRIP1STCHAR,
    IDM_EDIT_STRIPLASTCHAR,
    IDM_EDIT_SELECTIONDUPLICATE,
    IDM_EDIT_REMOVEBLANKLINES,
    IDM_EDIT_MERGEBLANKLINES,
    CMD_COPYFILENAME_NOEXT,
    CMD_COPYFILENAME,
    CMD_ENCLOSE_TRIPLE_SQ,
    CMD_ENCLOSE_TRIPLE_DQ,
    CMD_ENCLOSE_TRIPLE_BT,
    IDM_EDIT_LINECOMMENT,
    IDM_EDIT_STREAMCOMMENT,
    IDM_EDIT_MERGEDUPLICATELINE,
    IDM_EDIT_REMOVEDUPLICATELINE,
    IDM_EDIT_COMPRESSWS,
    IDM_EDIT_PADWITHSPACES,
    IDM_EDIT_LINETRANSPOSE,
    IDM_EDIT_DUPLICATELINE,
    IDM_EDIT_SORTLINES,
    IDM_EDIT_JOINLINES,
    IDM_EDIT_COLUMNWRAP,
    IDM_EDIT_SPLITLINES,
    IDM_EDIT_JOINLINESEX,
    IDM_EDIT_CUTLINE,
    IDM_EDIT_COPYLINE,
    IDM_EDIT_DELETELINE,
    IDM_EDIT_INSERT_LOC_DATE,
  } from "./menu-notepad2";
  import { EditorView, lineNumbers } from "@codemirror/view";
  import { EditorState, Compartment } from "@codemirror/state";
  import * as commands from "@codemirror/commands";
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
    defaultHighlightStyle,
    syntaxHighlighting,
    indentOnInput,
    bracketMatching,
    foldGutter,
    foldKeymap,
  } from "@codemirror/language";
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
  import {
    autocompletion,
    completionKeymap,
    closeBrackets,
    closeBracketsKeymap,
  } from "@codemirror/autocomplete";
  import { lintKeymap } from "@codemirror/lint";

  import { indentLess, indentMore, insertTab } from "@codemirror/commands";
  import {
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
    selectLine,
    selectParentSyntax,
    indentSelection,
    deleteLine,
    cursorMatchingBracket,
    toggleComment,
    toggleBlockComment,
    standardKeymap,
  } from "@codemirror/commands";

  import { indentUnit } from "@codemirror/language";

  import { getTheme } from "../cmexts";
  import {
    getLangFromFileName,
    getLangFromLexer,
    getLangName,
  } from "../cmlangs";
  import { focusEditorView } from "../cmutil";
  import {
    setClipboard,
    clearClipboard,
    debounce,
    len,
    throwIf,
    appendClipboard,
    preventDragOnElement,
    undoPreventDragOnElement,
    filterDataTransferEntries,
    locationRemoveSearchParamsNoReload,
    notepad2Size,
    toggleFullScreen,
    stripExt,
  } from "../util.js";
  import { onDestroy, onMount } from "svelte";
  import { tooltip } from "../actions/tooltip";
  import DialogAskSaveChanges from "./DialogAskSaveChanges.svelte";
  import DialogNotImplemented from "./DialogNotImplemented.svelte";
  import DialogSaveAs from "./DialogSaveAs.svelte";
  import DialogFileOpen from "./DialogFileOpen.svelte";
  import DialogAbout from "./DialogAbout.svelte";
  import {
    deserialize,
    FsFile,
    newLocalStorageFile,
    readFile,
    serialize,
    writeFile,
  } from "./FsFile";
  import { logNpEvent } from "./events";
  import {
    deleteDuplicateLines,
    deleteFirstChar,
    deleteLastChar,
    deleteLeadingWhitespace,
    deleteTrailingWhitespace,
    duplicateSelection,
    encloseSelection,
    mergeBlankLines,
    mergeDuplicateLines,
    removeBlankLines,
    padWithSpaces,
    compressWhitespace,
    cmdBase64EncodeStandard,
    cmdBase64EncodeURLSafe,
    cmdBase64EncodeHtmlImage,
    cmdBase64Decode,
    cmdBase64DecodeAsHex,
    cmdUrlEncode,
    cmdUrlDecode,
    swapSelectionsWithClipboard,
    transposeLines,
    duplicateLine,
    cutLine,
    copyLine,
    joinLines,
    replaceSelectionsWith,
    convertUpperCase,
    convertLowerCase,
    invertCase,
    titleCase,
    toDec,
    toHex,
    toOct,
    toBin,
    insertText,
  } from "../cmcommands";

  /** @type {HTMLElement} */
  let editorElement = null;
  /** @type {EditorView} */
  let editorView = null;

  let showMenu = true;

  // status line
  let showStatusBar = true;
  let statusLn1 = 1;
  let statusLn2 = 1;
  let statusCol1 = 1;
  let statusCol2 = 1;
  let statusSel = 0;
  let statusSelLn = 0;
  let statusSize = 0;
  let statusEncoding = "UTF-8";
  let statusLang = "Text";

  let showingAbout = false;

  /** @type {EditorSelection} */
  let currSelection = null;
  let hasSelection = false;
  $: updateSelectionState(currSelection);

  let hasClipboard = false;
  async function setToolbarEnabledState() {
    if (!isToolbarReady) {
      return;
    }
    // TODO: document must be focused to call this
    // maybe get this from codemirror
    // hasClipboard = (await getClipboard()) !== "";
    let needsRedraw = false;
    for (let i = 0; i < nIcons; i++) {
      let info = tbIconsInfo[i];
      let cmdId = info[0];
      let isEnabled = info[3];
      let isEnabledNew = isMenuEnabled(cmdId);
      if (isEnabled !== isEnabledNew) {
        needsRedraw = true;
        info[3] = isEnabledNew;
      }
    }
    // console.log("setToolbarEnabledState: needsRedraw:", needsRedraw);
    if (needsRedraw) {
      toolbarButtonsOrder = toolbarButtonsOrder;
    }
  }
  /**
   * @param {EditorSelection} sel
   */
  function updateSelectionState(sel) {
    hasSelection = false;
    if (!sel) {
      setToolbarEnabledState();
      return;
    }
    let n = len(sel.ranges);
    for (let i = 0; i < n; i++) {
      const r = sel.ranges[i];
      if (!r.empty) {
        hasSelection = true;
        setToolbarEnabledState();
        return;
      }
    }
  }

  // console.log("commands:", commands);

  let showWhitespace = false;
  let showWhitespaceCompartment = new Compartment();
  $: setShowWhitespace(showWhitespace);
  function setShowWhitespace(flag) {
    if (editorView) {
      const v = flag ? highlightWhitespace() : [];
      editorView.dispatch({
        effects: showWhitespaceCompartment.reconfigure(v),
      });
    }
  }

  let showTrailingWhitespace = true;
  let showTrailingWhitespaceCompartment = new Compartment();
  $: setShowTrailingWhitespace(showTrailingWhitespace);
  function setShowTrailingWhitespace(flag) {
    if (editorView) {
      const v = flag ? highlightTrailingWhitespace() : [];
      editorView.dispatch({
        effects: showTrailingWhitespaceCompartment.reconfigure(v),
      });
    }
  }

  let enableMultipleSelection = true;
  let enableMultipleSelectionCompartment = new Compartment();
  $: setEnableMultipleSelection(enableMultipleSelection);
  function setEnableMultipleSelection(flag) {
    if (editorView) {
      const v = EditorState.allowMultipleSelections.of(flag);
      editorView.dispatch({
        effects: enableMultipleSelectionCompartment.reconfigure(v),
      });
    }
  }

  // we use Scintila terminology, it's language in CodeMirror
  let lexer = null;
  let lexerCompartment = new Compartment();
  $: setLexer(lexer);
  function setLexer(lexer) {
    if (editorView) {
      const v = getLangFromLexer(lexer);
      if (v) {
        console.log("lang:", v);
        statusLang = getLangName(v);
        editorView.dispatch({
          // @ts-ignore
          effects: lexerCompartment.reconfigure(v),
        });
      }
    }
  }

  let lineSeparator = null;
  let lineSeparatorStatus = "any";
  let lineSeparatorCompartment = new Compartment();
  $: setLineSeparator(lineSeparator);
  function setLineSeparator(sep) {
    if (editorView) {
      const v = EditorState.lineSeparator.of(sep);
      editorView.dispatch({
        effects: lineSeparatorCompartment.reconfigure(v),
      });
    }
  }

  let tabSize = 4;
  let tabSizeCompartment = new Compartment();
  $: setTabSize(tabSize);
  function setTabSize(ts) {
    if (editorView) {
      const v = EditorState.tabSize.of(ts);
      editorView.dispatch({
        effects: tabSizeCompartment.reconfigure(v),
      });
    }
  }

  let tabsAsSpaces = true;
  let tabSpaces = 4;
  let tabsCompartment = new Compartment();
  $: setTabsState(tabsAsSpaces, tabSpaces);
  function setTabsState(tabsAsSpaces, tabSpaces) {
    if (editorView) {
      const indentChar = tabsAsSpaces ? " ".repeat(tabSpaces) : "\t";
      const v = indentUnit.of(indentChar);
      editorView.dispatch({
        effects: tabsCompartment.reconfigure(v),
      });
    }
  }

  let readOnly = false;
  let readOnlyCompartment = new Compartment();
  $: setReadOnlyState(readOnly);
  /**
   * @param {boolean} flag
   */
  function setReadOnlyState(flag) {
    if (editorView) {
      const v = EditorState.readOnly.of(flag);
      editorView.dispatch({
        effects: readOnlyCompartment.reconfigure(v),
      });
    }
  }

  function getCurrentSelectionAsText() {
    let v = editorView;
    let s = v.state.sliceDoc(
      v.state.selection.main.from,
      v.state.selection.main.to
    );
    return s;
  }

  let wordWrap = true;
  let wordWrapCompartment = new Compartment();
  $: setWordWrapState(wordWrap);
  function setWordWrapState(flag) {
    if (editorView) {
      const v = flag ? EditorView.lineWrapping : [];
      editorView.dispatch({
        effects: wordWrapCompartment.reconfigure(v),
      });
    }
  }

  //   lineNumbers(),
  let showLineNumbers = true;
  let showLineNumbersCompartment = new Compartment();
  $: setLineNumbersState(showLineNumbers);
  function setLineNumbersState(flag) {
    if (editorView) {
      const v = flag ? lineNumbers() : [];
      editorView.dispatch({
        effects: showLineNumbersCompartment.reconfigure(v),
      });
    }
  }

  /** @type {FsFile} */
  let file = null;
  let name = "Untitled";
  /** @type {EditorState} */
  let initialState = null;
  let isDirty = false;

  // dialogs
  let msgNotImplemented = "";
  let showingMsgNotImplemented = false;

  let showingSaveChanges = false;
  let saveName = "";

  let showingOpenFile = false;
  let showingSaveAs = false;

  $: giveEditorFocus(showingMsgNotImplemented);
  function giveEditorFocus(v) {
    if (!v) {
      console.log("giveEditorFocus:", v);
      if (editorView && !editorView.hasFocus) {
        focusEditorView(editorView);
      }
    }
  }

  /**
   * @param {FsFile} fileIn
   */
  function handleFileOpen(fileIn) {
    console.log("handleFileOpen:", fileIn);
    let content = readFile(fileIn);
    let state = createEditorState(content, fileIn.name);
    initialState = state;
    editorView.setState(initialState);
    focusEditorView(editorView);
    isDirty = false;
    file = fileIn;
    name = file.name;
    updateStatusLine();
    setToolbarEnabledState();
  }

  /**
   * @param {FsFile} fileIn
   */
  function handleSaveAs(fileIn) {
    console.log("handleSaveAs:", fileIn);
    initialState = editorView.state;
    let content = initialState.doc.toString();
    writeFile(fileIn, content);
    focusEditorView(editorView);
    isDirty = false;
    file = fileIn;
    name = file.name;
  }

  function updateStatusLine() {
    let v = editorView;
    let state = v.state;
    let sel = state.selection.main;
    let doc = state.doc;
    statusLn2 = doc.lines;
    statusSize = doc.length;
    let pos = sel.from;
    let line = doc.lineAt(pos);
    statusLn1 = line.number;
    statusCol1 = pos - line.from + 1;
    statusCol2 = line.length + 1;
  }

  function createEditorView() {
    throwIf(!editorElement);

    /**
     * @param {Transaction} tr
     */
    function handleEditorChange(tr) {
      let doc = tr.newDoc;
      isDirty = !doc.eq(initialState.doc);
      // must re-render tabs to show change indicator
    }

    /** @type {Function} */
    const changeFn = debounce(handleEditorChange, 300);

    /**
     * @param {Transaction} tr
     */
    function dispatchTransaction(tr) {
      editorView.update([tr]);

      if (tr.docChanged) {
        changeFn(tr);
      } else {
        currSelection = tr.state.selection;
      }
      updateStatusLine();
      setToolbarEnabledState();
    }

    return new EditorView({
      parent: editorElement,
      dispatch: dispatchTransaction,
    });
  }

  function handleMenuDidOpen(menuElement) {
    // console.log("handleMenuDidOpen:", menuElement);
    // perf note: this seems to complete in 1-3 ms
    const nodes = menuElement.querySelectorAll("[data-cmd-id]");
    for (let node of nodes.values()) {
      let el = /** @type {HTMLElement} */ (node);
      const cmdId = el.dataset.cmdId;
      let isEnabled = isMenuEnabled(cmdId);
      let cl = el.classList;
      cl.remove("menu-disabled");
      if (!isEnabled) {
        cl.add("menu-disabled");
      }
      let isChecked = isMenuChecked(cmdId);
      cl.remove("menu-checked");
      if (isChecked) {
        cl.add("menu-checked");
      }
    }
  }

  /**
   * @param {string} s
   * @param {string} fileName
   * @returns {EditorState}
   */
  function createEditorState(s, fileName = "") {
    let theme = undefined;
    let styles = undefined;
    let placeholder =
      "Welcome to notepad2web - a web re-implementation of notepad2 Windows text editor.\nYou can save files in the browser (localStorage) or open files from the file system (if supported by your browser).\nStart typing...";
    /** @type {Extension[]}*/

    // TODO: why is this [] and not null or something?
    // @ts-ignore
    let wordWrapV = wordWrap ? EditorView.lineWrapping : [];
    let multipleSelectionV = EditorState.allowMultipleSelections.of(
      enableMultipleSelection
    );
    let lineSeparatorV = EditorState.lineSeparator.of(lineSeparator);
    let readOnlyV = EditorState.readOnly.of(readOnly);
    let tabSizeV = EditorState.tabSize.of(tabSize);
    let lineNumV = showLineNumbers ? lineNumbers() : [];
    let showWhitespaceV = showWhitespace ? highlightWhitespace() : [];
    let showTrailingWhitespaceV = showTrailingWhitespace
      ? highlightTrailingWhitespace()
      : [];
    const indentChar = tabsAsSpaces ? " ".repeat(tabSpaces) : "\t";
    const tabStateV = indentUnit.of(indentChar);

    let lexerV = getLangFromFileName(fileName);
    statusLang = "Text";
    if (lexerV) {
      console.log("lang:", lexerV);
      statusLang = getLangName(lexerV);
    } else {
      lexerV = [];
    }

    /** @type {KeyBinding} */
    const indentWithTab2 = {
      key: "Tab",
      run: indentMore,
      shift: indentLess,
    };
    const defaultKeymap2 = [
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

      { key: "Mod-/", run: toggleComment },
      { key: "Alt-A", run: toggleBlockComment },
      // @ts-ignore
    ].concat(standardKeymap);

    // possibilities:
    // "▶", "▼"
    // "+", "−"
    // "⊞", "⊟"
    let foldClose = "⊞";
    let foldOpen = "⊟";
    const exts = [
      EditorView.editable.of(true), // ???
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
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
        ...defaultKeymap2,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
      ]),
      keymap.of([indentWithTab2]),
      placeholderExt(placeholder),
      tabsCompartment.of(tabStateV),
      tabSizeCompartment.of(tabSizeV),
      readOnlyCompartment.of(readOnlyV),
      lineSeparatorCompartment.of(lineSeparatorV),
      showWhitespaceCompartment.of(showWhitespaceV),
      showTrailingWhitespaceCompartment.of(showTrailingWhitespaceV),
      wordWrapCompartment.of(wordWrapV),
      enableMultipleSelectionCompartment.of(multipleSelectionV),
      showLineNumbersCompartment.of(lineNumV),
      foldGutter({
        closedText: foldClose,
        openText: foldOpen,
      }),
      // scrollPastEnd(), // TODO: not sure what it does
      lexerCompartment.of(lexerV),
      ...getTheme(theme, styles),
    ];
    return EditorState.create({
      doc: s ?? undefined,
      extensions: exts,
    });
  }

  // if currently active element is menu, blur() it (take away focus)
  function closeMenu() {
    let el = /** @type {HTMLElement}*/ (document.activeElement);
    if (el) {
      let role = el.attributes.getNamedItem("role");
      if (role && role.value === "menubar") {
        el.blur();
      }
    }
  }

  function newEmptyFile() {
    file = null;
    name = "Untitled";
    initialState = createEditorState("");
    editorView.setState(initialState);
    isDirty = false;
    focusEditorView(editorView);
    updateStatusLine();
    setToolbarEnabledState();
  }

  /**
   * return false if a given cmd should be disabled
   * based on the state of the app
   * @param {string} cmdId
   */
  function isMenuEnabled(cmdId) {
    if (!editorView) {
      return false;
    }
    let state = editorView.state;
    let n;
    switch (cmdId) {
      // TODO: much more that depend on selection state
      case IDM_EDIT_CUT:
      case IDT_EDIT_CUT:
      case IDM_EDIT_COPY:
      case IDT_EDIT_COPY:
      case IDM_EDIT_COPYADD:
      case IDM_EDIT_SELECTALL:
      case IDM_EDIT_CLEARCLIPBOARD:
      case IDM_EDIT_CONVERTUPPERCASE:
      case IDM_EDIT_CONVERTLOWERCASE:
      case IDM_EDIT_INVERTCASE:
      case IDM_EDIT_TITLECASE:
      case IDM_EDIT_SENTENCECASE:
      case IDM_EDIT_CONVERTSPACES:
      case IDM_EDIT_CONVERTTABS:
      case IDM_EDIT_CONVERTSPACES2:
      case IDM_EDIT_CONVERTTABS2:
      case IDM_EDIT_NUM2HEX:
      case IDM_EDIT_NUM2DEC:
      case IDM_EDIT_NUM2BIN:
      case IDM_EDIT_NUM2OCT:
      case CMD_ONLINE_SEARCH_GOOGLE:
      case CMD_ONLINE_SEARCH_BING:
      case CMD_ONLINE_SEARCH_WIKI:
      case IDM_EDIT_BASE64_ENCODE:
      case IDM_EDIT_BASE64_SAFE_ENCODE:
      case IDM_EDIT_BASE64_HTML_EMBEDDED_IMAGE:
      case IDM_EDIT_BASE64_DECODE:
      case IDM_EDIT_BASE64_DECODE_AS_HEX:
      case CMD_CUSTOM_ACTION1:
      case CMD_CUSTOM_ACTION2:
      case IDM_EDIT_URLENCODE:
      case IDM_EDIT_URLDECODE:
      case IDM_EDIT_SELECTIONDUPLICATE:
      case IDM_EDIT_SORTLINES:
      case IDM_EDIT_JOINLINES:
      case IDM_EDIT_COLUMNWRAP:
      case IDM_EDIT_SPLITLINES:
      case IDM_EDIT_JOINLINESEX:
        // console.log("isMenuEnabled:", cmdId, "hasSelection:", hasSelection);
        return hasSelection;

      case IDM_EDIT_COPYALL:
        return editorView.state.doc.length > 0;

      case IDM_EDIT_PASTE:
      case IDT_EDIT_PASTE:
        return hasClipboard;

      case IDM_EDIT_UNDO:
      case IDT_EDIT_UNDO:
        n = commands.undoDepth(state);
        return n > 0;

      case IDM_EDIT_REDO:
      case IDT_EDIT_REDO:
        n = commands.redoDepth(state);
        return n > 0;

      case IDM_EDIT_SWAP:
        return hasSelection && hasClipboard;

      case IDM_EDIT_LINETRANSPOSE:
        // TODO: if not at first line
        break;
    }
    return true;
  }

  function isMenuChecked(cmdId) {
    switch (cmdId) {
      case IDM_VIEW_MENU:
        return showMenu;
      case IDM_VIEW_WORDWRAP:
        return wordWrap;
      case IDM_FILE_READONLY_MODE:
        return readOnly;
      case IDM_VIEW_LINENUMBERS:
        return showLineNumbers;
      case IDM_VIEW_STATUSBAR:
        return showStatusBar;
      case IDM_VIEW_TOOLBAR:
        return showToolbar;
      case IDM_LINEENDINGS_CRLF:
        return lineSeparator == "\r\n";
      case IDM_LINEENDINGS_LF:
        return lineSeparator == "\n";
      case IDM_LINEENDINGS_CR:
        return lineSeparator == "\r";
      case IDM_VIEW_SHOWWHITESPACE:
        return showWhitespace;
      case IDM_SET_MULTIPLE_SELECTION:
        return enableMultipleSelection;
      case IDM_VIEW_TABSASSPACES:
        return tabsAsSpaces;
    }
    return false;
  }

  // 0 - file name
  // 1 - file name, no extension
  // 2 - full path (NYI)
  function copyFileNameToClipboard(type) {
    let toCopy = "";
    switch (type) {
      case 0:
        toCopy = name;
        break;
      case 1:
        toCopy = stripExt(name);
        break;
      default:
    }
    if (toCopy !== "") {
      setClipboard(toCopy);
    }
  }

  /**
   * @returns {string}
   */
  function genCurrentDate() {
    return new Date().toISOString().split("T")[0];
  }

  // this can be invoked via keyboard shortcut of via menu
  // if via keyboard, arg.detail.ev is set
  // TODO: if via menu, we need to be smart about closeMen() vs. closeMenuAndFocusEditor()
  async function handleMenuCmd(arg) {
    const cmdId = arg.detail.cmd;
    const ev = arg.detail.ev;
    let stopPropagation = true;
    switch (cmdId) {
      case IDM_FILE_NEW:
      case IDT_FILE_NEW:
        if (isDirty) {
          // TODO: ask if should save changes
        }
        newEmptyFile();
        break;
      case IDM_FILE_OPEN:
      case IDT_FILE_OPEN:
        showingOpenFile = true;
        // TODO: more
        break;
      case IDM_FILE_SAVE:
      case IDT_FILE_SAVE:
        if (file === null) {
          // TODO: need to provide callback to call when saving a file
          showingSaveAs = true;
        } else {
          handleSaveAs(file);
        }
        break;
      case IDM_FILE_SAVEAS:
      case IDT_FILE_SAVEAS:
        showingSaveAs = true;
        break;
      // case IDM_FILE_SAVECOPY:
      // case IDT_FILE_SAVECOPY:
      //   break;

      case IDM_VIEW_MENU:
        showMenu = !showMenu;
        break;
      case IDM_VIEW_WORDWRAP:
        wordWrap = !wordWrap;
        break;
      case IDM_FILE_READONLY_MODE:
        readOnly = !readOnly;
        break;
      case IDM_VIEW_SHOWWHITESPACE:
        showWhitespace = !showWhitespace;
        break;
      case IDM_FILE_NEWWINDOW2:
        // open empty window
        let uri = window.location.toString();
        window.open(uri);
        break;
      case IDM_VIEW_LINENUMBERS:
        showLineNumbers = !showLineNumbers;
        break;
      case IDM_VIEW_STATUSBAR:
        showStatusBar = !showStatusBar;
        break;
      case IDM_VIEW_TOOLBAR:
        showToolbar = !showToolbar;
        break;
      case IDM_SET_MULTIPLE_SELECTION:
        enableMultipleSelection = !enableMultipleSelection;
        break;
      case IDM_VIEW_TABSASSPACES:
        tabsAsSpaces = !tabsAsSpaces;
        break;
      // TODO: notepad2 changes line endings
      // not sure if that transfer to CM as it stores text
      // in lines. Does it re-split the doc when
      // EditorState.lineSeparator changes?
      case IDM_LINEENDINGS_CRLF:
        lineSeparator = "\r\n";
        lineSeparatorStatus = "CR+LF";
        break;
      case IDM_LINEENDINGS_CR:
        lineSeparator = "\r";
        lineSeparatorStatus = "CR";
        break;
      case IDM_LINEENDINGS_LF:
        lineSeparator = "\n";
        lineSeparatorStatus = "LF";
        break;
      case IDM_EDIT_DELETELINERIGHT:
        commands.deleteToLineEnd(editorView);
        break;
      case IDM_EDIT_DELETELINELEFT:
        commands.deleteToLineStart(editorView);
        break;
      case IDM_EDIT_SWAP:
        swapSelectionsWithClipboard(editorView);
        break;
      case IDM_EDIT_TRIMLINES:
        deleteTrailingWhitespace(editorView);
        break;
      case IDM_EDIT_TRIMLEAD:
        deleteLeadingWhitespace(editorView);
        break;
      case IDM_EDIT_STRIP1STCHAR:
        deleteFirstChar(editorView);
        break;
      case IDM_EDIT_STRIPLASTCHAR:
        deleteLastChar(editorView);
        break;
      case IDM_EDIT_SELECTIONDUPLICATE:
        duplicateSelection(editorView);
        break;
      case IDM_EDIT_REMOVEBLANKLINES:
        removeBlankLines(editorView);
        break;
      case IDM_EDIT_MERGEBLANKLINES:
        mergeBlankLines(editorView);
        break;
      case IDM_EDIT_LINETRANSPOSE:
        transposeLines(editorView);
        break;
      case IDM_EDIT_DUPLICATELINE:
        duplicateLine(editorView);
        break;
      case IDM_EDIT_CUTLINE:
        cutLine(editorView);
        break;
      case IDM_EDIT_COPYLINE:
        copyLine(editorView);
        break;
      case IDM_EDIT_DELETELINE:
        commands.deleteLine(editorView);
        break;
      case IDM_EDIT_JOINLINES:
        joinLines(editorView);
        break;
      case CMD_COPYFILENAME_NOEXT:
        copyFileNameToClipboard(1);
        break;
      case CMD_COPYFILENAME:
        copyFileNameToClipboard(0);
        break;
      case CMD_ENCLOSE_TRIPLE_SQ:
        encloseSelection(editorView, `'''`, `'''`);
        break;
      case CMD_ENCLOSE_TRIPLE_DQ:
        encloseSelection(editorView, `"""`, `"""`);
        break;
      case CMD_ENCLOSE_TRIPLE_BT:
        encloseSelection(editorView, "```", "```");
        break;
      case IDM_EDIT_STREAMCOMMENT:
        commands.blockComment(editorView);
        break;
      case IDM_EDIT_MERGEDUPLICATELINE:
        mergeDuplicateLines(editorView);
        break;
      case IDM_EDIT_REMOVEDUPLICATELINE:
        deleteDuplicateLines(editorView);
        break;
      case IDM_EDIT_PADWITHSPACES:
        padWithSpaces(editorView);
        break;
      case IDM_EDIT_COMPRESSWS:
        compressWhitespace(editorView);
        break;
      case IDM_EDIT_BASE64_ENCODE:
        cmdBase64EncodeStandard(editorView);
        break;
      case IDM_EDIT_BASE64_SAFE_ENCODE:
        cmdBase64EncodeURLSafe(editorView);
        break;
      case IDM_EDIT_BASE64_HTML_EMBEDDED_IMAGE:
        cmdBase64EncodeHtmlImage(editorView);
        break;
      case IDM_EDIT_BASE64_DECODE:
        cmdBase64Decode(editorView);
        break;
      case IDM_EDIT_BASE64_DECODE_AS_HEX:
        cmdBase64DecodeAsHex(editorView);
        break;
      case IDM_EDIT_URLENCODE:
        cmdUrlEncode(editorView);
        break;
      case IDM_EDIT_URLDECODE:
        cmdUrlDecode(editorView);
        break;
      case IDM_EDIT_CONVERTUPPERCASE:
        replaceSelectionsWith(editorView, convertUpperCase);
        break;
      case IDM_EDIT_CONVERTLOWERCASE:
        replaceSelectionsWith(editorView, convertLowerCase);
        break;
      case IDM_EDIT_INVERTCASE:
        replaceSelectionsWith(editorView, invertCase);
        break;
      case IDM_EDIT_TITLECASE:
        replaceSelectionsWith(editorView, titleCase);
        break;
      case IDM_EDIT_SENTENCECASE:
        break;
      case IDM_EDIT_CONVERTSPACES:
        break;
      case IDM_EDIT_CONVERTTABS:
        break;
      case IDM_EDIT_CONVERTSPACES2:
        break;
      case IDM_EDIT_CONVERTTABS2:
        break;
      case IDM_EDIT_NUM2HEX:
        replaceSelectionsWith(editorView, toHex);
        break;
      case IDM_EDIT_NUM2DEC:
        replaceSelectionsWith(editorView, toDec);
        break;
      case IDM_EDIT_NUM2BIN:
        replaceSelectionsWith(editorView, toBin);
        break;
      case IDM_EDIT_NUM2OCT:
        replaceSelectionsWith(editorView, toOct);
        break;
      case IDM_EDIT_INSERT_LOC_DATE:
        insertText(editorView, genCurrentDate);
        break;

      // those are handled by CodeMirror
      case IDM_EDIT_COPY:
      case IDT_EDIT_COPY:
      case IDM_EDIT_CUT:
      case IDT_EDIT_CUT:
      case IDM_EDIT_PASTE:
      case IDT_EDIT_PASTE:
      case IDM_EDIT_SELECTALL:
      case IDM_EDIT_UNDO:
      case IDT_EDIT_UNDO:
      case IDM_EDIT_REDO:
      case IDT_EDIT_REDO:
      case IDM_VIEW_TOGGLE_FULLSCREEN:
      case IDM_EDIT_INDENT:
      case IDM_EDIT_UNINDENT:
      case IDM_EDIT_MOVELINEDOWN:
      case IDM_EDIT_MOVELINEUP:
      case IDM_EDIT_LINECOMMENT:
        if (ev) {
          stopPropagation = false;
        } else {
          switch (cmdId) {
            case IDM_VIEW_TOGGLE_FULLSCREEN:
              toggleFullScreen();
              break;
            // case IDM_EDIT_CUT:
            // case IDT_EDIT_CUT:
            //   break;
            // case IDT_EDIT_COPY:
            // case IDM_EDIT_COPY:
            //   break;
            // case IDM_EDIT_PASTE:
            // case IDT_EDIT_PASTE:
            //   break;
            case IDM_EDIT_INDENT:
              commands.indentMore(editorView);
              break;
            case IDM_EDIT_UNINDENT:
              commands.indentLess(editorView);
              break;
            case IDM_EDIT_SELECTALL:
              commands.selectAll(editorView);
              break;
            case IDM_EDIT_UNDO:
            case IDT_EDIT_UNDO:
              commands.undo(editorView);
              break;
            case IDM_EDIT_REDO:
            case IDT_EDIT_REDO:
              commands.redo(editorView);
              break;
            case IDM_EDIT_MOVELINEDOWN:
              commands.moveLineDown(editorView);
              break;
            case IDM_EDIT_MOVELINEUP:
              commands.moveLineUp(editorView);
              break;
            case IDM_EDIT_LINECOMMENT:
              commands.toggleComment(editorView);
              break;
            default:
              // TODO: not handled
              msgNotImplemented = `Command ${cmdId} not yet implemented!`;
              showingMsgNotImplemented = true;
          }
        }
        break;
      case IDM_EDIT_DELETE:
      case IDT_EDIT_DELETE:
        // TODO: possibly deleteCharBackward()
        commands.deleteCharForward(editorView);
        break;
      case IDM_EDIT_COPYALL:
        // copy the whole text to clipbard
        let s = editorView.state.doc.toString();
        setClipboard(s);
        break;
      case IDM_EDIT_COPYADD:
        let sel = getCurrentSelectionAsText();
        if (sel !== "") {
          // Document must be focused for setting clipboard
          setTimeout(() => {
            appendClipboard(sel);
          }, 500);
        }
        break;
      case IDM_EDIT_CLEARDOCUMENT:
        // TODO: ask to save if dirty?
        newEmptyFile();
        break;
      case IDM_EDIT_CLEARCLIPBOARD:
        clearClipboard();
        break;
      case IDM_HELP_PROJECT_HOME:
        // TODO: needs home
        window.open("https://onlinetool.io/", "_blank");
        break;
      case IDM_HELP_REPORT_ISSUE:
      case IDM_HELP_FEATURE_REQUEST:
        window.open("https://github.com/kjk/notepad2web/issues", "_blank");
        break;
      case IDM_HELP_ABOUT:
        showingAbout = true;
        break;
      default:
        let lex = getLangFromLexer(cmdId);
        if (lex) {
          lexer = cmdId;
          break;
        }
        // TODO: not handled
        msgNotImplemented = `Command ${cmdId} not yet implemented!`;
        showingMsgNotImplemented = true;
    }
    if (ev) {
      if (stopPropagation) {
        ev.stopPropagation();
        ev.preventDefault();
      }
    } else {
      closeMenu();
      let showingDialog =
        showingAbout ||
        showingMsgNotImplemented ||
        showingOpenFile ||
        showingSaveAs ||
        showingSaveChanges;
      if (!showingDialog) {
        focusEditorView(editorView);
      }
    }
    console.log("showingMsgNotImplemented:", showingMsgNotImplemented);
    if (!showingMsgNotImplemented) {
      logNpEvent(cmdId);
    }
  }

  function openInitialFile() {
    // if has ?file=${fileID}, opens that
    // otherwise, opens empty file
    let params = new URLSearchParams(location.search);
    let fileId = params.get("file");
    if (fileId) {
      let file = deserialize(fileId);
      if (file) {
        handleFileOpen(file);
        locationRemoveSearchParamsNoReload();
        return;
      }
    }
    newEmptyFile();
  }

  let showToolbar = true;
  let isToolbarReady = false;

  // Notepad2.c. DefaultToolbarButtons
  let toolbarButtonsOrder = [
    22, 3, 0, 1, 2, 0, 4, 18, 19, 0, 5, 6, 0, 7, 8, 9, 20, 0, 10, 11, 0, 12, 0,
    24, 0, 15, 16, 0,
  ];
  // order of icons in toolbar bitmap
  // el[0] is id of the command sent by the icon
  // el[1] is tooltip for this icon
  // el[2] is dataURL for Image() for this icon
  // el[3] is enabled (if true)
  /** @type {[string, string, string, boolean][]}*/
  let tbIconsInfo = [
    [IDT_FILE_NEW, "New", "", true],
    [IDT_FILE_OPEN, "Open", "", true],
    [IDT_FILE_BROWSE, "Browse", "", true],
    [IDT_FILE_SAVE, "Save", "", true],
    [IDT_EDIT_UNDO, "Undo", "", true],
    [IDT_EDIT_REDO, "Redo", "", true],
    [IDT_EDIT_CUT, "Cut", "", true],
    [IDT_EDIT_COPY, "Copy", "", true],
    [IDT_EDIT_PASTE, "Paste", "", true],
    [IDT_EDIT_FIND, "Find", "", true],
    [IDT_EDIT_REPLACE, "Replace", "", true],
    [IDT_VIEW_WORDWRAP, "Word Wrap", "", true],
    [IDT_VIEW_ZOOMIN, "Zoom In", "", true],
    [IDT_VIEW_ZOOMOUT, "Zoom Out", "", true],
    [IDT_VIEW_SCHEME, "Select Scheme", "", true],
    [IDT_VIEW_SCHEMECONFIG, "Customize Schemes", "", true],
    [IDT_FILE_EXIT, "Exit", "", true],
    [IDT_FILE_SAVEAS, "Save As", "", true],
    [IDT_FILE_SAVECOPY, "Save Copy", "", true],
    [IDT_EDIT_DELETE, "Delete", "", true],
    [IDT_FILE_PRINT, "Print", "", true],
    [IDT_FILE_OPENFAV, "Favorites", "", true],
    [IDT_FILE_ADDTOFAV, "Add to Favorites", "", true],
    [IDT_VIEW_TOGGLEFOLDS, "Toggle Folds", "", true],
    [IDT_FILE_LAUNCH, "Execute Document]", "", true],
    [IDT_VIEW_ALWAYSONTOP, "Always On Top", "", true],
  ];
  const nIcons = len(tbIconsInfo);
  let iconDy = 24;
  let iconDx = iconDy;
  function buildIconImages() {
    let uriBmp = "";
    switch (iconDy) {
      case 16:
        uriBmp = "Toolbar16.bmp";
        break;
      case 24:
        uriBmp = "Toolbar24.bmp";
        break;
      default:
        throwIf(true, `unsupported iconDy of ${iconDy}`);
    }

    let img = new Image();
    img.onload = () => {
      let canvasTmp = document.createElement("canvas");
      // canvasTmp.setAttribute("willReadFrequently", "true");
      canvasTmp.width = iconDx;
      canvasTmp.height = iconDy;
      let dw = iconDx;
      let dh = iconDy;
      let sw = iconDx;
      let sh = iconDy;
      let dx = 0;
      let dy = 0;
      let sy = 0;
      for (let i = 0; i < nIcons; i++) {
        let ctx = canvasTmp.getContext("2d", { willReadFrequently: true });
        let sx = i * iconDx;
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
        let imgd = ctx.getImageData(0, 0, iconDy, iconDy);
        let pix = imgd.data;
        function makePixTransparent(n) {
          let i = n * 4;
          let v = pix[i] + pix[i + 1] + pix[i + 2];
          if (v === 0) {
            pix[i + 3] = 0;
          }
        }
        let nPixels = iconDx * iconDy;
        for (let i = 0; i < nPixels; i++) {
          makePixTransparent(i);
        }
        ctx.putImageData(imgd, 0, 0);
        let dataURL = canvasTmp.toDataURL("image/png");
        tbIconsInfo[i][2] = dataURL;
      }
      isToolbarReady = true;
      setToolbarEnabledState();
    };
    img.src = uriBmp;
  }

  onMount(() => {
    buildIconImages();
    preventDragOnElement(document);
    editorView = createEditorView();
    openInitialFile();

    // document.addEventListener("keydown", onKeyDown);
    focusEditorView(editorView);
    return () => {
      undoPreventDragOnElement(document);
    };
  });

  async function handleDrop(ev) {
    console.log("file drop:", ev);
    console.log("dt:", ev.dataTransfer);
    let files = await filterDataTransferEntries(ev.dataTransfer);
    let first = files[0];
    console.log("first:", first);
    console.log("first.file:", first.file);
    let content = await first.file.text();
    // TODO: open in new window
    let name = first.file.name;
    let fs = newLocalStorageFile(name);
    writeFile(fs, content);
    let uriName = serialize(fs);
    let uri = window.location.toString();
    uri += "?file=" + encodeURIComponent(uriName);
    window.open(uri);
    // this opens a new window and will trigger openInitialFile()
    // from onMount()
  }

  onDestroy(() => {
    editorView = null;
    // document.removeEventListener("keydown", onKeyDown);
  });
</script>

<svelte:body on:drop={handleDrop} />

<main class="fixed inset-0 grid">
  {#if showMenu}
    <div class="flex items-center shadow text-sm">
      <a href="/" class="ml-1 px-1 hover:bg-black/5" use:tooltip={"all tools"}
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
        >
          <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8h5Z" />
        </svg></a
      >
      <MenuBar
        menuDidOpenFn={handleMenuDidOpen}
        menuBar={mainMenuBar}
        on:menucmd={handleMenuCmd}
      />
      <div class="grow" />
      {#if isDirty}
        <div>*&nbsp;</div>
      {/if}
      <div class="mr-2">
        {name}
      </div>
    </div>
  {:else}
    <MenuBar menuBar={null} />
    <button
      class="absolute top-[2px] px-2 py-0.5 right-[4px] hover:bg-gray-100 text-gray-600"
      on:click={() => (showMenu = true)}>show menu</button
    >
  {/if}

  {#if showToolbar && isToolbarReady}
    <div class="flex pl-1">
      {#each toolbarButtonsOrder as idx}
        {#if idx === 0}
          <div class="w-[4px]" />
        {:else}
          {@const info = tbIconsInfo[idx - 1]}
          {@const cmdId = info[0]}
          {@const txt = info[1]}
          {@const dataURL = info[2]}
          {@const disabled = !info[3]}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <img
            src={dataURL}
            alt={txt}
            use:tooltip={txt}
            width={iconDx}
            height={iconDy}
            class:disabled
            class="mt-1 px-1 py-1 hover:bg-blue-100"
            on:click={() => handleMenuCmd({ detail: { cmd: cmdId } })}
          />
        {/if}
      {/each}
    </div>
  {:else}
    <div class="w-0 h-0" />
  {/if}

  <div class="min-h-0 overflow-hidden">
    <div
      class="codemirror-wrapper overflow-auto flex-grow bg-transparent"
      bind:this={editorElement}
    />
  </div>

  {#if showStatusBar}
    <div class="flex justify-between px-2 bg-gray-50 text-sm gap-4">
      <div>Ln {statusLn1} / {statusLn2}</div>
      <div>Col {statusCol1} / {statusCol2}</div>
      <div>Sel {statusSel} Sel Ln {statusSelLn}</div>
      <div class="grow" />
      <div>{statusLang}</div>
      <div>{statusEncoding}</div>
      <div>{lineSeparatorStatus}</div>
      <div>{notepad2Size(statusSize)}</div>
    </div>
  {:else}
    <div />
  {/if}

  {#if showingOpenFile}
    <DialogFileOpen bind:open={showingOpenFile} handleOpen={handleFileOpen} />
  {/if}

  {#if showingSaveAs}
    <DialogSaveAs
      bind:open={showingSaveAs}
      name={saveName}
      handleSave={handleSaveAs}
    />
  {/if}

  {#if showingSaveChanges}
    <DialogAskSaveChanges bind:open={showingSaveChanges} filePath="foo.md" />
  {/if}

  <DialogAbout bind:open={showingAbout} />

  <DialogNotImplemented
    bind:open={showingMsgNotImplemented}
    msg={msgNotImplemented}
  />
</main>

<style>
  .disabled {
    opacity: 0.5;
  }
  .disabled:hover {
    background-color: white;
  }

  main {
    grid-template-rows: auto auto 1fr auto;
  }

  :global(.codemirror-wrapper) {
    height: 100%;
  }
  :global(.cm-editor) {
    overflow: hidden;
    height: 100%;
  }
</style>
