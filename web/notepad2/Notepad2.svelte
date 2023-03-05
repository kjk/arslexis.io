<script context="module">
  /** @typedef { import("@codemirror/view").KeyBinding} KeyBinding */
  /** @typedef { import("@codemirror/state").Extension} Extension */
  /** @typedef { import("@codemirror/state").Transaction} Transaction */
  /** @typedef { import("@codemirror/language").LanguageSupport} LanguageSupport */
  /** @typedef {import("@codemirror/state").SelectionRange} SelectionRange */
  /** @typedef {import("./np2store").FavEntry} FavEntry */
</script>

<script>
  import { onDestroy, onMount } from "svelte";
  import MenuBar from "../MenuBar.svelte";
  import Toolbar from "./Toolbar.svelte";
  import Twitter from "../icons/Twitter.svelte";
  import GitHub from "../icons/GitHub.svelte";
  import DialogAskSaveChanges from "./DialogAskSaveChanges.svelte";
  import DialogNotImplemented from "./DialogNotImplemented.svelte";
  import DialogSaveAs from "./DialogSaveAs.svelte";
  import DialogFileOpen from "./DialogFileOpen.svelte";
  import DialogAbout from "./DialogAbout.svelte";
  import DialogGoTo from "./DialogGoTo.svelte";
  import DialogEncloseSelection from "./DialogEncloseSelection.svelte";
  import DialogInsertXmlTag from "./DialogInsertXmlTag.svelte";
  import DialogFind from "./DialogFind.svelte";
  import DialogAddFavorite from "./DialogAddFavorite.svelte";
  import DialogFavorites from "./DialogFavorites.svelte";
  import { tooltip } from "../actions/tooltip";
  import { EditorView } from "@codemirror/view";
  import { EditorSelection, EditorState } from "@codemirror/state";
  import { openSearchPanel } from "@codemirror/search";
  import * as commands from "@codemirror/commands";
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
    IDT_VIEW_SCHEME,
    IDT_VIEW_SCHEMECONFIG,
    IDT_FILE_SAVEAS,
    IDT_FILE_SAVECOPY,
    IDT_EDIT_DELETE,
    IDT_FILE_PRINT,
    IDT_FILE_ADDTOFAV,
    IDT_VIEW_TOGGLEFOLDS,
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
    IDM_EDIT_INSERT_LOC_DATETIME,
    IDM_EDIT_INSERT_GUID,
    IDM_INSERT_UNICODE_ALM,
    IDM_INSERT_UNICODE_ZWSP,
    IDM_INSERT_UNICODE_LS,
    IDM_INSERT_UNICODE_PS,
    IDM_INSERT_UNICODE_US,
    IDM_INSERT_UNICODE_RS,
    IDM_INSERT_UNICODE_IAFS,
    IDM_INSERT_UNICODE_AAFS,
    IDM_INSERT_UNICODE_ISS,
    IDM_INSERT_UNICODE_ASS,
    IDM_INSERT_UNICODE_NODS,
    IDM_INSERT_UNICODE_NADS,
    IDM_INSERT_UNICODE_PDF,
    IDM_INSERT_UNICODE_PDI,
    IDM_INSERT_UNICODE_FSI,
    IDM_INSERT_UNICODE_RLI,
    IDM_INSERT_UNICODE_LRI,
    IDM_INSERT_UNICODE_RLO,
    IDM_INSERT_UNICODE_LRO,
    IDM_INSERT_UNICODE_RLE,
    IDM_INSERT_UNICODE_LRE,
    IDM_INSERT_UNICODE_RLM,
    IDM_INSERT_UNICODE_LRM,
    IDM_INSERT_UNICODE_ZWNJ,
    IDM_INSERT_UNICODE_ZWJ,
    IDM_INSERT_UNICODE_WJ,
    CMD_INSERTFILENAME_NOEXT,
    IDM_EDIT_INSERT_FILENAME,
    IDM_EDIT_INSERT_UTC_DATETIME,
    IDM_EDIT_INSERT_TIMESTAMP,
    IDM_EDIT_INSERT_TIMESTAMP_MS,
    IDM_EDIT_INSERT_TIMESTAMP_US,
    IDM_EDIT_INSERT_SHORTDATE,
    IDM_EDIT_INSERT_LONGDATE,
    IDM_VIEW_SHOWFILENAMEONLY,
    IDM_VIEW_SHOWEXCERPT,
    IDM_EDIT_SELTODOCSTART,
    IDM_EDIT_SELTODOCEND,
    IDM_EDIT_CHAR2HEX,
    IDM_EDIT_HEX2CHAR,
    IDM_EDIT_SHOW_HEX,
    IDM_EDIT_ESCAPECCHARS,
    IDM_EDIT_UNESCAPECCHARS,
    IDM_EDIT_XHTML_ESCAPE_CHAR,
    IDM_EDIT_XHTML_UNESCAPE_CHAR,
    IDM_EDIT_ENCLOSESELECTION,
    IDM_EDIT_INSERT_XMLTAG,
    CMD_CTRLBACK,
    CMD_CTRLDEL,
    noMenuCommands,
    IDM_DUMP_SELECTIONS,
    CMD_JUMP2SELSTART,
    CMD_JUMP2SELEND,
    IDM_VIEW_MATCHBRACES,
    IDM_VIEW_HIGHLIGHTCURRENTLINE_NONE,
    IDM_VIEW_HIGHLIGHTCURRENTLINE_BACK,
    IDM_VIEW_HIGHLIGHTCURRENTLINE_FRAME,
    IDM_EDIT_GOTOLINE,
    IDM_EDIT_FIND,
    IDM_EDIT_FINDNEXT,
    IDM_EDIT_FINDPREV,
    IDM_EDIT_REPLACE,
    IDM_FILE_ADDTOFAV,
    IDM_FILE_OPENFAV,
    IDM_FILE_MANAGEFAV,
  } from "./menu-notepad2";
  import { getTheme } from "../cmexts";
  import {
    getLangExtFromFileName,
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
  import {
    deserialize,
    FsFile,
    newLocalStorageFile,
    openFilePicker,
    readFile,
    saveFilePicker,
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
    insertText,
    selectToDocStart,
    selectToDocEnd,
    insertAfterSelection,
    encloseSelections,
    dumpSelections,
    goToSelectionStartEnd,
    goToPos,
  } from "../cmcommands";
  import {
    uuidv4,
    convertUpperCase,
    convertLowerCase,
    invertCase,
    titleCase,
    toDec,
    toHex,
    toOct,
    toBin,
    charToHex,
    hexToChar,
    showHex,
    xhtmlEscapeChars,
    xhtmlUnEscapeChars,
    escapeCChars,
    unescapeCChars,
  } from "../strutil";
  import { findUnicodeStrByMenuID } from "./unicodeChars";
  import {
    getCurrentDate,
    getCurrentDateTime,
    getLongDate,
    getShortDate,
    getUnixTimestampMs,
    getUnixTimestampSeconds,
    getUnixTimestampUs,
    getUTCDate,
  } from "../dateutil";
  import { tick } from "svelte";
  import { Settings } from "./Settings";
  import {
    setConfigEditorView,
    updateEnableMultipleSelection,
    updateLang,
    updateLineHighlightType,
    updateLineNumbersState,
    updateLineSeparator,
    updateReadOnly,
    updateShowTrailingWhitespace,
    updateShowWhitespace,
    updateTabSize,
    updateTabsState,
    updateVisualBraceMatching,
    updateWordWrap,
  } from "../CodeMirrorConfig";
  import { supportsFileSystem } from "../fileutil";
  import { makeConfig } from "./editorConfig";
  import { getFavorites, setFavorites } from "./np2store";

  let settings = new Settings();

  let toolbarFuncs;

  /** @type {HTMLElement} */
  let editorElement = null;
  /** @type {EditorView} */
  let editorView = null;

  // status line
  let statusLn1 = 1;
  let statusLn2 = 1;
  let statusCol1 = 1;
  let statusCol2 = 1;
  let statusSel = 0;
  let statusSelLn = 0;
  let statusSize = 0;
  let statusEncoding = "UTF-8";
  let statusLang = "Text";

  /** @type {EditorSelection} */
  let currSelection = null;
  let hasSelection = false;
  $: updateSelectionState(currSelection);

  // TODO: track this or remove use of it
  let hasClipboard = true;
  /**
   * @param {EditorSelection} sel
   */
  function updateSelectionState(sel) {
    function nonEmptySelection() {
      if (!sel) {
        return false;
      }
      for (let r of sel.ranges) {
        if (!r.empty) {
          return true;
        }
      }
      return false;
    }
    hasSelection = nonEmptySelection();
    setToolbarEnabledState();
  }

  async function setToolbarEnabledState() {
    if (toolbarFuncs) {
      toolbarFuncs.setToolbarEnabledState();
    }
  }

  /*
   * @param {number} max
   * @returns {string}
   */
  function getCurrentSelection(max) {
    let res = "";
    for (let r of currSelection.ranges) {
      if (r.empty) {
        continue;
      }
      let sLen = Math.min(r.to - r.from, max - len(res));
      let s = editorView.state.sliceDoc(r.from, r.from + sLen);
      res += s;
      if (len(res) >= max) {
        return res;
      }
    }
    return res;
  }

  function focusEditor() {
    focusEditorView(editorView);
  }

  /**
   * @param {string} s
   * @returns {string}
   */
  function sanitizeString(s) {
    s = s.replace(/\s+/g, " ");
    s = s.replace(/\s+$/g, "");
    s = s.replace(/^\s+/g, "");
    return s;
  }

  // console.log("commands:", commands);
  setConfigEditorView(null);
  $: updateShowWhitespace(settings.showWhitespace);
  $: updateShowTrailingWhitespace(settings.showTrailingWhitespace);
  $: updateEnableMultipleSelection(settings.enableMultipleSelection);
  let lineSeparatorStatus = "any";
  $: updateLineSeparator(settings.lineSeparator);
  $: updateVisualBraceMatching(settings.visualBraceMatching);
  $: updateTabSize(settings.tabSize);
  $: updateTabsState(settings.tabsAsSpaces, settings.tabSpaces);
  $: updateReadOnly(settings.readOnly);
  $: updateLineHighlightType(settings.lineHighlightType);
  $: updateWordWrap(settings.wordWrap);
  $: updateLineNumbersState(settings.showLineNumbers);
  // we use Scintila terminology, it's language in CodeMirror
  let lexer = null;
  $: updateLexer(lexer);
  function updateLexer(lexer) {
    const lang = getLangFromLexer(lexer);
    if (lang) {
      console.log("lang:", lang);
      statusLang = getLangName(lang);
      updateLang(lang);
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

  /** @type {FsFile} */
  let file = null;
  let name = "Untitled";
  /** @type {EditorState} */
  let initialState = null;
  let isDirty = false;

  let fileNameDisplay = IDM_VIEW_SHOWFILENAMEONLY;
  let fileNameExcerpt = "";
  let shownFileName = ""; // what we show to the user

  $: updateFileNameDisplay(isDirty, fileNameDisplay, name);
  function updateFileNameDisplay(isDirty, fileNameDisplay, name) {
    switch (fileNameDisplay) {
      case IDM_VIEW_SHOWFILENAMEONLY:
        shownFileName = name;
        break;
      case IDM_VIEW_SHOWEXCERPT:
        shownFileName = fileNameExcerpt;
        break;
    }
    if (isDirty) {
      shownFileName = "* " + shownFileName;
    }
  }

  // dialogs
  let msgNotImplemented = "";
  let showingMsgNotImplemented = false;

  let onOpenFileDone;
  let showingOpenFile = false;

  let askSaveChangesName;
  let onAskSaveChangesDone;
  let showingAskSaveChanges = false;

  let saveAsName = "";
  let onSaveAsDone;
  let showingSaveAs = false;

  let onEncloseSelectionDone;
  let showingEncloseSelection = false;

  let onInserXmlTagDone;
  let showingInsertXmlTag = false;

  let onAddToFavoritesDone;
  let showingAddToFavorites = false;

  let onFavoritesDone;
  /** @type {FavEntry[]} */
  let favorites;
  let showingFavorites = false;

  let onGoToDone;
  let goToMaxLine;
  let showingGoTo = false;

  let showingFind = false;

  let showingAbout = false;

  let isShowingDialog = false;
  $: isShowingDialog =
    showingMsgNotImplemented ||
    showingOpenFile ||
    showingAskSaveChanges ||
    showingSaveAs ||
    showingEncloseSelection ||
    showingInsertXmlTag ||
    showingGoTo ||
    showingAddToFavorites ||
    showingFavorites ||
    showingAbout;

  // if we're transitioning from showing some dialog to not showing it,
  // this will trigger and if it's false, it means we've closed a dialog
  // and therefore should focus editor
  $: retakeFocusIf(!isShowingDialog);
  function retakeFocusIf(shouldRetake) {
    if (shouldRetake) {
      focusEditor();
    }
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

    // TODO: why is this [] and not null or something?
    let lang = getLangExtFromFileName(fileName);
    statusLang = "Text";
    if (lang) {
      console.log("lang:", lang);
      statusLang = getLangName(lang);
    } else {
      lang = [];
    }

    const exts = [...makeConfig(settings, lang), ...getTheme(theme, styles)];
    let res = EditorState.create({
      doc: s ?? undefined,
      extensions: exts,
    });
    setConfigEditorView(editorView);
    return res;
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
    updateStatusLine();
    setToolbarEnabledState();
  }

  /**
   * @param {number} type
   * 0 - file name
   * 1 - file name, no extension
   * 2 - full path (NYI)
   * @returns {string}
   */
  function getFileName(type) {
    switch (type) {
      case 0:
        return name;
      case 1:
        return stripExt(name);
      case 2:
        throwIf(true, "NYI");
      default:
        throwIf(true, `invalid type ${type}`);
    }
    return "";
  }

  /**
   * @param {number} type
   */
  function copyFileNameToClipboard(type) {
    const toCopy = getFileName(type);
    if (toCopy !== "") {
      setClipboard(toCopy);
    }
  }

  function launchSelectionWithGoogle() {
    let s = getCurrentSelection(128);
    let uri = "https://www.google.com/search?q=" + encodeURIComponent(s);
    window.open(uri);
  }

  function launchSelectionWithBing() {
    let s = getCurrentSelection(128);
    let uri = "https://www.bing.com/search?q=" + encodeURIComponent(s);
    window.open(uri);
  }

  function launchSelectionWithWikipedia() {
    let s = getCurrentSelection(128);
    let uri =
      "https://en.wikipedia.org/wiki/Special:Search?search=" +
      encodeURIComponent(s);
    window.open(uri);
  }

  function getCurrentContent() {
    return editorView.state.doc.toString();
  }

  /**
   * @reuturns {Promise<FsFile>}
   */
  async function saveFilePickerLocalStorage() {
    return new Promise((resolve, reject) => {
      onSaveAsDone = (file) => {
        resolve(file);
      };
      showingSaveAs = true;
    });
  }

  /**
   * @reuturns {Promise<FsFile>}
   */
  async function openFilePickerLocalStorate() {
    return new Promise((resolve, reject) => {
      onOpenFileDone = (file) => {
        resolve(file);
      };
      showingOpenFile = true;
    });
  }

  /**
   * @param {string} content
   * @param {boolean} saveCopy
   * @returns {Promise<boolean>}
   */
  async function contentSaveAs(content, saveCopy) {
    if (!content) {
      content = getCurrentContent();
    }
    if (supportsFileSystem()) {
      let f = await saveFilePicker(name);
      if (f === null) {
        return true;
      }
      await writeFile(f, content);
      if (!saveCopy) {
        setContentAsCurrent(content);
      }
      return false;
    }
    // fallback to local storage
    let f = await saveFilePickerLocalStorage();
    if (f) {
      await writeFile(f, content);
      if (!saveCopy) {
        setContentAsCurrent(content);
      }
      return false;
    }
    return true;
  }

  /**
   * @param {string} [content]
   * @returns Promise<boolean> true if cancelled saving
   */
  async function contentSave(content) {
    if (!content) {
      content = getCurrentContent();
    }
    if (file) {
      writeFile(file, content);
      return false;
    }
    return await contentSaveAs(content, false);
  }

  /**
   * @param {FsFile} fileIn
   */
  function saveFile(fileIn) {
    console.log("saveFile:", fileIn);
    initialState = editorView.state;
    let content = initialState.doc.toString();
    writeFile(fileIn, content);
    isDirty = false;
    file = fileIn;
    name = file.name;
  }

  function setContentAsCurrent(content, name) {
    let state = createEditorState(content, name);
    initialState = state;
    editorView.setState(initialState);
    isDirty = false;
    updateStatusLine();
    setToolbarEnabledState();
  }

  /**
   * @param {FsFile} fileIn
   */
  async function setFileAsCurrent(fileIn) {
    console.log("setCurrentFile:", fileIn);
    let content = await readFile(fileIn);
    if (content === null) {
      // could be serialized FileSystemFileHandle with denied permissions
      console.log("Denied permissions for:", fileIn);
      return;
    }
    file = fileIn;
    name = file.name;
    setContentAsCurrent(content, name);
  }

  async function loadFile() {
    if (supportsFileSystem()) {
      let f = await openFilePicker();
      if (!f) {
        return;
      }
      await setFileAsCurrent(f);
      return;
    }
    let f = await openFilePickerLocalStorate();
    if (!f) {
      return;
    }
    await setFileAsCurrent(f);
  }

  /**
   * @returns {Promise<string>}
   */
  async function askToSaveFile() {
    return new Promise((resolve, reject) => {
      askSaveChangesName = name;
      onAskSaveChangesDone = (why) => {
        resolve(why);
      };
      showingAskSaveChanges = true;
    });
  }

  async function cmdFileNew() {
    if (!isDirty) {
      newEmptyFile();
      return;
    }
    let action = await askToSaveFile();
    if (action === "cancel") {
      return;
    }
    if (action === "no") {
      newEmptyFile();
      return;
    }
    throwIf(action !== "yes");
    let didCancel = await contentSave();
    if (didCancel) {
      return;
    }
    // TODO: or do this always?
    newEmptyFile();
  }

  function cmdFileSaveAs() {
    let content = getCurrentContent();
    contentSaveAs(content, false);
  }

  function cmdFileSaveCopy() {
    let content = getCurrentContent();
    contentSaveAs(content, true);
  }

  function cmdFileSave() {
    if (file) {
      saveFile(file);
      return;
    }
    let content = getCurrentContent();
    contentSave(content);
  }

  async function cmdFileOpen() {
    if (!isDirty) {
      loadFile();
      return;
    }
    let action = await askToSaveFile();
    if (action === "cancel") {
      return;
    }
    if (action === "no") {
      loadFile();
      return;
    }
    throwIf(action !== "yes");
    let didCancel = await contentSave();
    if (didCancel) {
      return;
    }
    // TODO: or do this always?
    loadFile();
  }

  function limit(n, min, max) {
    if (n < min) {
      return min;
    }
    if (n > max) {
      return max;
    }
    return n;
  }

  async function cmdFileAddToFav() {
    if (!file) {
      return;
    }
    let res = new Promise((resolve, reject) => {
      onAddToFavoritesDone = async (name) => {
        if (name) {
          let favs = await getFavorites();
          /** @type {FavEntry} */
          let e = {
            fs: file.type,
            name: file.name,
            favName: name,
            id: file.id,
            fileHandle: file.fileHandle,
          };
          console.log("onAddToFavoritesDone:", e);
          favs.push(e);
          setFavorites(favs);
        }
        resolve();
      };
      showingAddToFavorites = true;
    });
    return res;
  }

  /**
   * @returns {Promise<FavEntry>}
   */
  async function openFavDialog() {
    favorites = await getFavorites();
    /**
     * @param {FavEntry} fav
     */
    let res = new Promise((resolve, reject) => {
      onFavoritesDone = async (fav) => {
        resolve(fav);
      };
      showingFavorites = true;
    });
    return res;
  }

  async function cmdFileOpenFav() {
    const fav = await openFavDialog();
    if (!fav) {
      return;
    }
    const name = fav.name; // or fav.favName?
    const f = new FsFile(fav.fs, name, name);
    f.fileHandle = fav.fileHandle;
    f.id = fav.id;
    console.log("onFavoritesDone:", f);
    await setFileAsCurrent(f);
  }

  async function cmdEditGoToLine() {
    let res = new Promise((resolve, reject) => {
      onGoToDone = (lineNo, colNo) => {
        if (lineNo != null) {
          const doc = editorView.state.doc;
          lineNo = limit(lineNo, 1, doc.lines);
          const line = doc.line(lineNo);
          colNo = colNo || 1;
          const maxCol = doc.line(lineNo).length;
          colNo = limit(colNo, 1, maxCol);
          const pos = line.from + colNo;
          goToPos(editorView, pos);
        }
        resolve();
      };
      goToMaxLine = editorView.state.doc.lines;
      showingGoTo = true;
    });
    return res;
  }

  async function cmdEncloseSelection() {
    let res = new Promise((resolve, reject) => {
      onEncloseSelectionDone = (before, after) => {
        if (before && after) {
          encloseSelections(editorView, before, after);
        }
      };
      showingEncloseSelection = true;
    });
    return res;
  }

  function cmdEditFind() {
    showingFind = true;
  }

  async function cmdInsertXmlTag() {
    let res = new Promise((resolve, reject) => {
      onInserXmlTagDone = (before, after) => {
        if (before && after) {
          encloseSelections(editorView, before, after);
        }
      };
      showingInsertXmlTag = true;
    });
    return res;
  }

  async function cmdEditPaste() {
    const s = await navigator.clipboard.readText();
    insertText(editorView, s);
  }

  // this can be invoked via keyboard shortcut of via menu
  // if via keyboard, arg.detail.ev is set
  // TODO: if via menu, we need to be smart about closeMen() vs. closeMenuAndFocusEditor()
  async function handleMenuCmd(arg) {
    const cmdId = arg.detail.cmd;
    const ev = arg.detail.ev;
    let s = "";
    let stopPropagation = true;
    const fromMenu = !ev;
    let noEditorFocus = false;
    // if invoked from menu we need to give editor focus back
    // unless we're showing a dialog
    switch (cmdId) {
      // those potentially show dialogs
      case IDM_FILE_NEW:
      case IDT_FILE_NEW:
        cmdFileNew();
        break;
      case IDM_EDIT_CLEARDOCUMENT:
        // TODO: ask to save if dirty?
        newEmptyFile();
        break;
      case IDM_FILE_OPEN:
      case IDT_FILE_OPEN:
        cmdFileOpen();
        break;
      case IDM_FILE_SAVE:
      case IDT_FILE_SAVE:
        cmdFileSave();
        break;
      case IDM_FILE_SAVEAS:
      case IDT_FILE_SAVEAS:
        cmdFileSaveAs();
        break;
      case IDM_FILE_SAVECOPY:
      case IDT_FILE_SAVECOPY:
        cmdFileSaveCopy();
        break;
      case IDM_FILE_READONLY_MODE:
        settings.readOnly = !settings.readOnly;
        break;
      case IDM_FILE_NEWWINDOW2:
        // open empty window
        let uri = window.location.toString();
        window.open(uri);
        break;
      case IDM_FILE_ADDTOFAV:
        cmdFileAddToFav();
        break;
      case IDM_FILE_OPENFAV:
      case IDM_FILE_MANAGEFAV:
        cmdFileOpenFav();
        break;

      case IDM_EDIT_GOTOLINE:
        cmdEditGoToLine();
        break;

      case IDM_EDIT_ENCLOSESELECTION:
        cmdEncloseSelection();
        break;
      case IDM_EDIT_INSERT_XMLTAG:
        cmdInsertXmlTag();
        break;
      case IDM_HELP_ABOUT:
        showingAbout = true;
        break;

      case IDM_DUMP_SELECTIONS:
        dumpSelections(editorView);
        break;

      case IDM_VIEW_HIGHLIGHTCURRENTLINE_NONE:
      case IDM_VIEW_HIGHLIGHTCURRENTLINE_BACK:
      case IDM_VIEW_HIGHLIGHTCURRENTLINE_FRAME:
        settings.lineHighlightType = cmdId;
        break;

      case IDM_EDIT_CHAR2HEX:
        replaceSelectionsWith(editorView, charToHex);
        break;
      // case IDM_EDIT_HEX2CHAR:
      //   replaceSelectionsWith(editorView, hexToChar);
      //   break;
      case IDM_EDIT_SHOW_HEX:
        insertAfterSelection(editorView, showHex);
        break;
      case IDM_EDIT_ESCAPECCHARS:
        replaceSelectionsWith(editorView, escapeCChars);
        break;
      case IDM_EDIT_UNESCAPECCHARS:
        replaceSelectionsWith(editorView, unescapeCChars);
        break;
      case IDM_EDIT_XHTML_ESCAPE_CHAR:
        // TODO: if XML, needs use xhtmlEscapeCharsForXML
        replaceSelectionsWith(editorView, xhtmlEscapeChars);
        break;
      case IDM_EDIT_XHTML_UNESCAPE_CHAR:
        // TODO: if XML, needs use xhtmlUnEscapeCharsForXML
        replaceSelectionsWith(editorView, xhtmlUnEscapeChars);
        break;

      case IDM_EDIT_SELTODOCSTART:
        selectToDocStart(editorView);
        break;
      case IDM_EDIT_SELTODOCEND:
        selectToDocEnd(editorView);
        break;
      case IDM_VIEW_MENU:
        settings.showMenu = !settings.showMenu;
        break;
      case IDM_VIEW_WORDWRAP:
      case IDT_VIEW_WORDWRAP:
        settings.wordWrap = !settings.wordWrap;
        break;
      case IDM_VIEW_SHOWWHITESPACE:
        settings.showWhitespace = !settings.showWhitespace;
        break;

      case IDM_VIEW_LINENUMBERS:
        settings.showLineNumbers = !settings.showLineNumbers;
        break;
      case IDM_VIEW_STATUSBAR:
        settings.showStatusBar = !settings.showStatusBar;
        break;
      case IDM_VIEW_TOOLBAR:
        settings.showToolbar = !settings.showToolbar;
        break;
      case IDM_SET_MULTIPLE_SELECTION:
        settings.enableMultipleSelection = !settings.enableMultipleSelection;
        break;
      case IDM_VIEW_TABSASSPACES:
        settings.tabsAsSpaces = !settings.tabsAsSpaces;
        break;
      case IDM_VIEW_MATCHBRACES:
        settings.visualBraceMatching = !settings.visualBraceMatching;
        break;
      // case IDM_VIEW_SHOW_FOLDING:
      //   showFolding = !showFolding;
      //   break;
      // TODO: notepad2 changes line endings
      // not sure if that transfer to CM as it stores text
      // in lines. Does it re-split the doc when
      // EditorState.lineSeparator changes?
      case IDM_LINEENDINGS_CRLF:
        settings.lineSeparator = "\r\n";
        lineSeparatorStatus = "CR+LF";
        break;
      case IDM_LINEENDINGS_CR:
        settings.lineSeparator = "\r";
        lineSeparatorStatus = "CR";
        break;
      case IDM_LINEENDINGS_LF:
        settings.lineSeparator = "\n";
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
      // case IDM_EDIT_SENTENCECASE:
      //   break;
      // case IDM_EDIT_CONVERTSPACES:
      //   break;
      // case IDM_EDIT_CONVERTTABS:
      //   break;
      // case IDM_EDIT_CONVERTSPACES2:
      //   break;
      // case IDM_EDIT_CONVERTTABS2:
      //   break;
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
        insertText(editorView, getCurrentDate);
        break;
      case IDM_EDIT_INSERT_LOC_DATETIME:
        insertText(editorView, getCurrentDateTime);
        break;
      case IDM_EDIT_INSERT_UTC_DATETIME:
        insertText(editorView, getUTCDate);
        break;
      case IDM_EDIT_INSERT_TIMESTAMP:
        insertText(editorView, getUnixTimestampSeconds);
        break;
      case IDM_EDIT_INSERT_TIMESTAMP_MS:
        insertText(editorView, getUnixTimestampMs);
        break;
      case IDM_EDIT_INSERT_TIMESTAMP_US:
        insertText(editorView, getUnixTimestampUs);
        break;
      case IDM_EDIT_INSERT_SHORTDATE:
        insertText(editorView, getShortDate);
        break;
      case IDM_EDIT_INSERT_LONGDATE:
        insertText(editorView, getLongDate);
        break;
      case IDM_VIEW_SHOWFILENAMEONLY:
      // case IDM_VIEW_SHOWFILENAMEFIRST:
      // case IDM_VIEW_SHOWFULLPATH:
      case IDM_VIEW_SHOWEXCERPT:
        fileNameDisplay = cmdId;
        if (cmdId === IDM_VIEW_SHOWEXCERPT) {
          s = getCurrentSelection(128);
          fileNameExcerpt = `"` + sanitizeString(s) + `"`;
        }
        break;

      case IDM_EDIT_INSERT_GUID:
        insertText(editorView, uuidv4);
        break;
      case IDM_INSERT_UNICODE_WJ:
      case IDM_INSERT_UNICODE_ZWJ:
      case IDM_INSERT_UNICODE_ZWNJ:
      case IDM_INSERT_UNICODE_LRM:
      case IDM_INSERT_UNICODE_RLM:
      case IDM_INSERT_UNICODE_LRE:
      case IDM_INSERT_UNICODE_RLE:
      case IDM_INSERT_UNICODE_LRO:
      case IDM_INSERT_UNICODE_RLO:
      case IDM_INSERT_UNICODE_LRI:
      case IDM_INSERT_UNICODE_RLI:
      case IDM_INSERT_UNICODE_FSI:
      case IDM_INSERT_UNICODE_PDI:
      case IDM_INSERT_UNICODE_PDF:
      case IDM_INSERT_UNICODE_NADS:
      case IDM_INSERT_UNICODE_NODS:
      case IDM_INSERT_UNICODE_ASS:
      case IDM_INSERT_UNICODE_ISS:
      case IDM_INSERT_UNICODE_AAFS:
      case IDM_INSERT_UNICODE_IAFS:
      case IDM_INSERT_UNICODE_ALM:
      case IDM_INSERT_UNICODE_RS:
      case IDM_INSERT_UNICODE_US:
      case IDM_INSERT_UNICODE_LS:
      case IDM_INSERT_UNICODE_PS:
      case IDM_INSERT_UNICODE_ZWSP:
        s = findUnicodeStrByMenuID(cmdId);
        insertText(editorView, s);
        break;
      case IDM_EDIT_INSERT_FILENAME:
        insertText(editorView, getFileName(0));
        break;
      case CMD_INSERTFILENAME_NOEXT:
        insertText(editorView, getFileName(1));
        break;
      // case IDM_EDIT_INSERT_PATHNAME:
      //   insertText(editorView, getFileName(2));
      //   break;
      case CMD_ONLINE_SEARCH_GOOGLE:
        launchSelectionWithGoogle();
        break;
      case CMD_ONLINE_SEARCH_BING:
        launchSelectionWithBing();
        break;
      case CMD_ONLINE_SEARCH_WIKI:
        launchSelectionWithWikipedia();
        break;
      case CMD_JUMP2SELSTART:
        goToSelectionStartEnd(editorView, false);
        break;
      case CMD_JUMP2SELEND:
        goToSelectionStartEnd(editorView, true);
        break;

      // those are handled by CodeMirror
      case IDM_EDIT_COPY:
      case IDT_EDIT_COPY:
      case IDM_EDIT_CUT:
      case IDT_EDIT_CUT:
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
      case CMD_CTRLBACK:
      case CMD_CTRLDEL:
      case IDM_EDIT_FIND: // TODO: custom dialog
      case IDM_EDIT_FINDNEXT:
      case IDM_EDIT_FINDPREV:
      case IDM_EDIT_REPLACE:
        if (ev) {
          // if invoked via keyboard, CodeMirror has already handled it
          stopPropagation = false;
        } else {
          switch (cmdId) {
            case IDM_VIEW_TOGGLE_FULLSCREEN:
              toggleFullScreen();
              break;
            case IDM_EDIT_CUT:
            case IDT_EDIT_CUT:
              document.execCommand("cut");
              break;
            case IDT_EDIT_COPY:
            case IDM_EDIT_COPY:
              document.execCommand("copy");
              break;
            case IDM_EDIT_PASTE:
            case IDT_EDIT_PASTE:
              cmdEditPaste();
              break;
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
      case IDT_EDIT_FIND:
      case IDT_EDIT_REPLACE:
        openSearchPanel(editorView);
        noEditorFocus = true;
        break;
      case IDM_EDIT_DELETE:
      case IDT_EDIT_DELETE:
        // TODO: possibly deleteCharBackward()
        commands.deleteCharForward(editorView);
        break;
      case IDM_EDIT_COPYALL:
        // copy the whole text to clipbard
        s = editorView.state.doc.toString();
        setClipboard(s);
        break;
      case IDM_EDIT_COPYADD:
        let sel = getCurrentSelectionAsText();
        if (sel !== "") {
          // Document must be focused for setting clipboard
          // TODO: more reliable way
          setTimeout(() => {
            appendClipboard(sel);
          }, 500);
        }
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
    if (fromMenu) {
      closeMenu();
      // need to delay until isShowingDialog is re-calculated
      tick().then(() => {
        if (!isShowingDialog && !noEditorFocus) {
          focusEditor();
        }
      });
    } else {
      throwIf(!ev);
      if (stopPropagation) {
        console.log("stopPropagataion:", cmdId);
        ev.stopPropagation();
        ev.preventDefault();
      }
    }
    // console.log("showingMsgNotImplemented:", showingMsgNotImplemented);
    if (!showingMsgNotImplemented) {
      logNpEvent(cmdId);
    }
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
      case IDM_VIEW_SHOWEXCERPT:
      case CMD_ONLINE_SEARCH_GOOGLE:
      case CMD_ONLINE_SEARCH_BING:
      case CMD_ONLINE_SEARCH_WIKI:
      case IDM_EDIT_CHAR2HEX:
      case IDM_EDIT_HEX2CHAR:
      case IDM_EDIT_SHOW_HEX:
      case IDM_EDIT_ESCAPECCHARS:
      case IDM_EDIT_UNESCAPECCHARS:
      case IDM_EDIT_XHTML_ESCAPE_CHAR:
      case IDM_EDIT_XHTML_UNESCAPE_CHAR:
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

      case IDM_FILE_SAVE:
      case IDT_FILE_SAVE:
        return isDirty;

      case IDM_FILE_ADDTOFAV:
        return file != null;

      case IDM_EDIT_LINETRANSPOSE:
        // TODO: if not at first line
        break;
    }
    return true;
  }

  function isMenuChecked(cmdId) {
    switch (cmdId) {
      case IDM_VIEW_MENU:
        return settings.showMenu;
      case IDM_VIEW_WORDWRAP:
        return settings.wordWrap;
      case IDM_FILE_READONLY_MODE:
        return settings.readOnly;
      case IDM_VIEW_LINENUMBERS:
        return settings.showLineNumbers;
      case IDM_VIEW_STATUSBAR:
        return settings.showStatusBar;
      case IDM_VIEW_TOOLBAR:
        return settings.showToolbar;
      case IDM_LINEENDINGS_CRLF:
        return settings.lineSeparator === "\r\n";
      case IDM_LINEENDINGS_LF:
        return settings.lineSeparator === "\n";
      case IDM_LINEENDINGS_CR:
        return settings.lineSeparator === "\r";
      case IDM_VIEW_SHOWWHITESPACE:
        return settings.showWhitespace;
      case IDM_SET_MULTIPLE_SELECTION:
        return settings.enableMultipleSelection;
      case IDM_VIEW_TABSASSPACES:
        return settings.tabsAsSpaces;
      case IDM_VIEW_SHOWFILENAMEONLY:
      case IDM_VIEW_SHOWEXCERPT:
        return fileNameDisplay === cmdId;
      case IDM_VIEW_MATCHBRACES:
        return settings.visualBraceMatching;
      case IDM_VIEW_HIGHLIGHTCURRENTLINE_NONE:
      case IDM_VIEW_HIGHLIGHTCURRENTLINE_BACK:
      case IDM_VIEW_HIGHLIGHTCURRENTLINE_FRAME:
        return settings.lineHighlightType === cmdId;
    }
    return false;
  }

  function openInitialFile() {
    // if has ?file=${fileID}, opens that
    // otherwise, opens empty file
    let params = new URLSearchParams(location.search);
    let fileId = params.get("file");
    if (fileId) {
      let file = deserialize(fileId);
      if (file) {
        setFileAsCurrent(file);
        locationRemoveSearchParamsNoReload();
        return;
      }
    }
    newEmptyFile();
  }

  onMount(() => {
    preventDragOnElement(document);
    editorView = createEditorView();
    openInitialFile();

    // document.addEventListener("keydown", onKeyDown);
    focusEditor();
    return () => {
      undoPreventDragOnElement(document);
    };
  });

  async function handleDrop(ev) {
    // console.log("file drop:", ev);
    console.log("dt:", ev.dataTransfer);
    let files = await filterDataTransferEntries(ev.dataTransfer);
    if (len(files) === 0) {
      return;
    }
    let first = files[0];
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
  <div class="flex flex-nowrap items-center shadow text-xs z-10">
    {#if settings.showMenu}
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
        {noMenuCommands}
        on:menucmd={handleMenuCmd}
      />
      <div class="truncate italic text-gray-500">
        {shownFileName}
      </div>
      <div class="grow" />
      <a
        class="px-1 py-1 mr-1 hover:bg-gray-100"
        href="https://github.com/kjk/notepad2web"
        target="_blank"
        rel="noreferrer"
      >
        <GitHub />
      </a>
      <a
        class="px-1 py-1 mr-2 hover:bg-gray-100"
        href="https://twitter.com/kjk"
        target="_blank"
        rel="noreferrer"
      >
        <Twitter />
      </a>
    {:else}
      <MenuBar
        hidden={true}
        menuDidOpenFn={handleMenuDidOpen}
        menuBar={mainMenuBar}
        {noMenuCommands}
        on:menucmd={handleMenuCmd}
      />
      <div class="absolute flex top-[2px] right-[4px] text-sm">
        <div class="py-0.5 truncate italic text-gray-500">
          {shownFileName}
        </div>
        <button
          class="ml-2 px-2 py-0.5 hover:bg-gray-100 text-gray-600"
          on:click={() => (settings.showMenu = true)}>show menu</button
        >
      </div>
    {/if}
  </div>

  <Toolbar
    bind:funcs={toolbarFuncs}
    bind:show={settings.showToolbar}
    {isMenuEnabled}
    {handleMenuCmd}
  />
  <div class="min-h-0 overflow-hidden">
    <div
      class="codemirror-wrapper overflow-auto flex-grow bg-transparent"
      bind:this={editorElement}
    />
  </div>

  {#if settings.showStatusBar}
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

  <DialogFileOpen bind:open={showingOpenFile} onDone={onOpenFileDone} />

  <DialogSaveAs
    bind:open={showingSaveAs}
    name={saveAsName}
    onDone={onSaveAsDone}
  />

  <DialogAskSaveChanges
    bind:open={showingAskSaveChanges}
    name={askSaveChangesName}
    onDone={onAskSaveChangesDone}
  />

  <DialogFind bind:open={showingFind} />

  <DialogGoTo
    bind:open={showingGoTo}
    onDone={onGoToDone}
    maxLine={goToMaxLine}
  />

  <DialogAddFavorite
    bind:open={showingAddToFavorites}
    {name}
    onDone={onAddToFavoritesDone}
  />

  <DialogFavorites
    bind:open={showingFavorites}
    {favorites}
    onDone={onFavoritesDone}
  />
  <DialogAbout bind:open={showingAbout} />

  <DialogEncloseSelection
    bind:open={showingEncloseSelection}
    onDone={onEncloseSelectionDone}
  />

  <DialogInsertXmlTag
    bind:open={showingInsertXmlTag}
    onDone={onInserXmlTagDone}
  />

  <DialogNotImplemented
    bind:open={showingMsgNotImplemented}
    msg={msgNotImplemented}
  />
</main>

<style>
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
