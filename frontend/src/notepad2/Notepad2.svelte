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
  import DialogBrowse from "./DialogBrowse.svelte";
  import DialogAbout from "./DialogAbout.svelte";
  import DialogGoTo from "./DialogGoTo.svelte";
  import DialogEncloseSelection from "./DialogEncloseSelection.svelte";
  import DialogInsertXmlTag from "./DialogInsertXmlTag.svelte";
  import DialogFind from "./DialogFind.svelte";
  import DialogAddFavorite from "./DialogAddFavorite.svelte";
  import DialogFavorites from "./DialogFavorites.svelte";
  import Progress from "../Progress.svelte";
  import { tooltip } from "../actions/tooltip";
  import { EditorView } from "@codemirror/view";
  import { EditorSelection, EditorState } from "@codemirror/state";
  import { toggleFold } from "@codemirror/language";
  import { openSearchPanel } from "@codemirror/search";
  import * as commands from "@codemirror/commands";
  import * as m from "./menu-notepad2";
  import {
    getCMLangFromFileName,
    getCMLangFromLexer,
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
    limit,
    arrayRemoveFnAsync,
  } from "../util.js";
  import {
    deserialize,
    FsFile,
    newIndexedDBFile,
    openFilePicker,
    readFile,
    saveFilePicker,
    serialize,
    writeFile,
  } from "./FsFile";
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
    toggleFoldAll,
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
  import { settings } from "./Settings";
  import {
    themeNameDefault,
    setConfigEditorView,
    themeNameDark,
    updateCodeFolding,
    updateEnableMultipleSelection,
    updateIndentGuides,
    updateLang,
    updateLineHighlightType,
    updateLineNumbersState,
    updateLineSeparator,
    updateReadOnly,
    updateScrollPastEnd,
    updateShowTrailingWhitespace,
    updateShowWhitespace,
    updateTabSize,
    updateTabsState,
    updateTheme,
    updateVisualBraceMatching,
    updateWordWrap,
  } from "../CodeMirrorConfig";
  import { supportsFileSystem, verifyHandlePermission } from "../fileutil";
  import { makeConfig } from "./editorConfig";
  import {
    favorites,
    recent,
    favEntryFromFsFile,
    fsFileFromFavEntry,
    getAndClearFileForNewWindow,
    rememberFileForNewWindow,
    favEq,
  } from "./np2store";
  import Messages, { showError } from "../Messages.svelte";
  import DialogSelectScheme from "./DialogSelectScheme.svelte";
  import { logEventRaw, logNpEvent } from "../events";

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
  $: updateCodeFolding(settings.showCodeFolding);
  $: updateIndentGuides(settings.showIndentGuides);
  $: updateTabSize(settings.tabSize);
  $: updateTabsState(settings.tabsAsSpaces, settings.tabSpaces);
  $: updateReadOnly(settings.readOnly);
  $: updateLineHighlightType(settings.lineHighlightType);
  $: updateWordWrap(settings.wordWrap);
  $: updateLineNumbersState(settings.showLineNumbers);
  $: updateScrollPastEnd(settings.scrollPastEnd);
  $: updateTheme(settings.theme);

  // we use Scintila terminology, it's language in CodeMirror
  let lexerId = null;
  $: updateLexer(lexerId);
  function updateLexer(lexerId) {
    if (!lexerId) {
      return;
    }
    if (lexerId === m.IDM_LEXER_TEXTFILE) {
      statusLang = "text";
      updateLang(null);
      return;
    }
    getCMLangFromLexer(lexerId).then((lang) => {
      if (!lang) {
        return;
      }
      console.log("lang:", lang);
      statusLang = getLangName(lang);
      updateLang(lang);
    });
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

  let fileNameDisplay = m.IDM_VIEW_SHOWFILENAMEONLY;
  let fileNameExcerpt = "";
  let shownFileName = ""; // what we show to the user

  $: updateFileNameDisplay(isDirty, fileNameDisplay, name);
  function updateFileNameDisplay(isDirty, fileNameDisplay, name) {
    switch (fileNameDisplay) {
      case m.IDM_VIEW_SHOWFILENAMEONLY:
        shownFileName = name;
        break;
      case m.IDM_VIEW_SHOWEXCERPT:
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

  /** @type {Function} */
  let onOpenFileDone;
  let showingOpenFile = false;

  let askSaveChangesName;
  /** @type {Function} */
  let onAskSaveChangesDone;
  let showingAskSaveChanges = false;

  let fileBrowseCloseOnFileOpen = true;
  let fileBrowseTitle = "Browse Files";
  let onFileBrowseDone = onFileBrowseDoneDefault;
  let showingFileBrowse = false;

  let saveAsName = "";
  /** @type {Function} */
  let onSaveAsDone;
  let showingSaveAs = false;

  /** @type {Function} */
  let onEncloseSelectionDone;
  let showingEncloseSelection = false;

  /** @type {Function} */
  let onInserXmlTagDone;
  let showingInsertXmlTag = false;

  /** @type {Function} */
  let onAddToFavoritesDone;
  let showingAddToFavorites = false;

  /** @type {Function} */
  let onFavoritesDone;
  let favoritesType = "";
  let showingFavorites = false;

  /** @type {Function} */
  let onGoToDone;
  let goToMaxLine;
  let showingGoTo = false;

  let showingFind = false;

  /** @type {Function} */
  let onSelectSchemeDone;
  let showingSelectScheme = false;

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
    showingFileBrowse ||
    showingSelectScheme ||
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
   * @returns {Promise<EditorState>}
   */
  async function createEditorState(s, fileName = "") {
    // TODO: why is this [] and not null or something?
    let lang = await getCMLangFromFileName(fileName);
    statusLang = "Text";
    if (lang) {
      console.log("lang:", lang);
      statusLang = getLangName(lang);
    } else {
      lang = [];
    }

    const exts = [...makeConfig(settings, lang)];
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

  async function newEmptyFile() {
    if (!editorView) {
      console.log("newEmptyFile: no editorView");
      return;
    }
    file = null;
    name = "Untitled";
    initialState = await createEditorState("");
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

  /**
   * @returns {Blob}
   */
  function getCurrentContent() {
    const s = editorView.state.doc.toString();
    const d = new TextEncoder().encode(s);
    const blob = new Blob([d.buffer]);
    return blob;
  }

  /**
   * @reuturns {Promise<FsFile>}
   */
  async function saveFilePickerIndexedDB() {
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
  async function openFilePickerLocalStorage() {
    return new Promise((resolve, reject) => {
      onOpenFileDone = (file) => {
        resolve(file);
      };
      showingOpenFile = true;
    });
  }

  /**
   * @param {Blob} content
   * @param {boolean} saveCopy
   * @returns {Promise<boolean>} return false if saved (???)
   */
  async function contentBrowserSaveAs(content, saveCopy) {
    // fallback to indexeddb
    let f = await saveFilePickerIndexedDB();
    if (!f) {
      return true;
    }
    await writeFile(f, content);
    if (!saveCopy) {
      setContentAsCurrent(content, f.name);
    }
    return false;
  }

  /**
   * @param {Blob} content
   * @param {boolean} saveCopy
   * @returns {Promise<boolean>} return false if saved (???)
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
        setContentAsCurrent(content, f.name);
      }
      return false;
    }
    return await contentBrowserSaveAs(content, saveCopy);
  }

  /**
   * @param {Blob} [blob]
   * @returns {Promise<boolean>} true if cancelled saving
   */
  async function contentSave(blob) {
    if (!blob) {
      blob = getCurrentContent();
    }
    if (file) {
      writeFile(file, blob);
      return false;
    }
    return await contentSaveAs(blob, false);
  }

  /**
   * @param {FsFile} fileIn
   */
  function saveFile(fileIn) {
    console.log("saveFile:", fileIn);
    initialState = editorView.state;
    const content = initialState.doc.toString();
    const d = new TextEncoder().encode(content);
    const blob = new Blob([d.buffer]);
    writeFile(fileIn, blob);
    isDirty = false;
    file = fileIn;
    name = file.name;
  }

  /**
   * @param {Blob|string} content
   * @param {string} fileName
   */
  async function setContentAsCurrent(content, fileName) {
    if (content instanceof Blob) {
      const ab = await content.arrayBuffer();
      content = new TextDecoder().decode(ab);
    }
    let state = await createEditorState(content, fileName);
    initialState = state;
    editorView.setState(initialState);
    name = fileName;
    isDirty = false;
    updateStatusLine();
    setToolbarEnabledState();
  }

  /**
   * open new window with
   * @param {FsFile} f
   */
  async function openFileInNewWindow(f) {
    if (f.fileHandle) {
      const ok = await verifyHandlePermission(f.fileHandle, false);
      if (!ok) {
        return;
      }
      // TODO: should also read content because file could be deleted
      await rememberFileForNewWindow(f);
      const uri =
        location.toString() + "?file=" + encodeURI("__for_new_window");
      window.open(uri);
    } else {
      const uriName = serialize(f);
      let uri = window.location.toString();
      uri += "?file=" + encodeURIComponent(uriName);
      window.open(uri);
      // this opens a new window and will trigger openInitialFile()
      // from onMount()
    }
  }

  /**
   * @param {FsFile} fileIn
   */
  async function setFileAsCurrent(fileIn) {
    console.log("setFileAsCurrent:", fileIn);
    // if file exists and has changed, open in a new window
    if (file && isDirty) {
      await openFileInNewWindow(fileIn);
      return;
    }

    // TODO: maybe move before openFileInNewWindow() to verify file
    // can be read in this window. But it's more expensive
    const blob = await readFile(fileIn);
    if (blob === null) {
      // could be serialized FileSystemFileHandle with denied permissions
      // or failed to read file because it was deleted
      console.log("Couldn't open file:", fileIn);
      showError(`Couldn't open file '${fileIn.name}'`, 3000);
      return;
    }

    file = fileIn;
    name = file.name;
    await setContentAsCurrent(blob, name);
    if (!settings.rememberRecentFiles) {
      return;
    }
    const e = favEntryFromFsFile(file, name);
    await addToRecent(e);
  }

  function filterMenuItem(mi) {
    if (len(mi) < 2) {
      return false;
    }
    const id = mi[1];
    if (Array.isArray(id)) {
      return false;
    }
    switch (id) {
      case m.IDM_FILE_OPEN_COMPUTER:
        return !supportsFileSystem();
    }
    return false;
  }

  /**
   * @param {FavEntry} e
   */
  async function addToRecent(e) {
    // push new value at the top
    const a = await arrayRemoveFnAsync($recent, e, favEq);
    $recent = [e].concat(a);
  }

  async function openFileComputer() {
    if (!supportsFileSystem()) {
      return false;
    }
    const f = await openFilePicker();
    if (!f) {
      return true; // TODO: or false?
    }
    await setFileAsCurrent(f);
    return true;
  }

  async function openFile() {
    if (openFileComputer()) {
      return;
    }
    const f = await openFilePickerLocalStorage();
    if (!f) {
      return;
    }
    await setFileAsCurrent(f);
  }

  async function openFileBrowse() {
    showingFileBrowse = false;
    fileBrowseTitle = "Open File";
    await tick();
    const p = new Promise((resolve, reject) => {
      onFileBrowseDone = (f) => {
        onFileBrowseDone = onFileBrowseDoneDefault;
        fileBrowseTitle = "Browse Files";
        resolve(f);
      };
      showingFileBrowse = true;
    });
    let f = await p;
    console.log("openFileBrowse:", f);
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
      await newEmptyFile();
      return;
    }
    const action = await askToSaveFile();
    if (action === "cancel") {
      return;
    }
    if (action === "no") {
      await newEmptyFile();
      return;
    }
    throwIf(action !== "yes");
    const didCancel = await contentSave();
    if (didCancel) {
      return;
    }
    // TODO: or do this always?
    newEmptyFile();
  }

  function cmdFileSaveAs() {
    const content = getCurrentContent();
    contentSaveAs(content, false);
  }

  function cmdFileBrowserSaveAs() {
    const content = getCurrentContent();
    contentBrowserSaveAs(content, false);
  }

  function cmdFileSaveCopy() {
    const content = getCurrentContent();
    contentSaveAs(content, true);
  }

  function cmdFileNewEmptyWindow() {
    const uri = window.location.toString();
    window.open(uri);
  }

  /**
   * open new window with current file or empty window
   * if working of new file
   * @param {FsFile} f
   */
  async function cmdFileNewWindow(f) {
    if (!f) {
      cmdFileNewEmptyWindow();
      return;
    }
    openFileInNewWindow(f);
  }

  function cmdFileSave() {
    if (file) {
      saveFile(file);
      return;
    }
    const content = getCurrentContent();
    contentSave(content);
  }

  async function cmdFileOpenComputer() {
    if (!isDirty) {
      openFile();
      return;
    }
    const action = await askToSaveFile();
    if (action === "cancel") {
      return;
    }
    if (action === "no") {
      openFile();
      return;
    }
    throwIf(action !== "yes");
    const didCancel = await contentSave();
    if (didCancel) {
      return;
    }
    // TODO: or do this always?
    openFile();
  }

  async function cmdFileOpen() {
    if (!isDirty) {
      openFileBrowse();
      // openFile();
      return;
    }
    const action = await askToSaveFile();
    if (action === "cancel") {
      return;
    }
    if (action === "no") {
      openFileBrowse();
      // openFile();
      return;
    }
    throwIf(action !== "yes");
    const didCancel = await contentSave();
    if (didCancel) {
      return;
    }
    // TODO: or do this always?
    openFileBrowse();
    // openFile();
  }

  async function cmdFileAddToFav() {
    if (!file) {
      return;
    }
    let res = new Promise((resolve, reject) => {
      onAddToFavoritesDone = async (name) => {
        if (name) {
          const e = favEntryFromFsFile(file, name);
          $favorites = $favorites.concat(e);
        }
        resolve();
      };
      showingAddToFavorites = true;
    });
    return res;
  }

  /**
   * @param {"favorites"|"recent"} type
   * @returns {Promise<FavEntry>}
   */
  async function openFavDialog(type) {
    favoritesType = type;
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
    const fav = await openFavDialog("favorites");
    if (!fav) {
      return;
    }
    const name = fav.name; // or fav.favName?
    const f = new FsFile(fav.fs, name, name);
    f.fileHandle = fav.fileHandle;
    f.id = fav.id;
    console.log("cmdFileOpenFav:", f);
    await setFileAsCurrent(f);
  }

  async function cmdFileOpenRecent() {
    const fav = await openFavDialog("recent");
    if (!fav) {
      return;
    }
    const f = fsFileFromFavEntry(fav);
    console.log("cmdFileOpenRecent:", f);
    await setFileAsCurrent(f);
  }

  function onFileBrowseDoneDefault(f) {
    if (!f) {
      return;
    }
    setFileAsCurrent(f);
  }

  async function cmdFileBrowse() {
    showingFileBrowse = true;
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

  function cmdViewToggleFolds() {
    toggleFoldAll(editorView);
  }

  function cmdViewFoldCurrentBlock() {
    toggleFold(editorView);
  }

  async function cmdViewScheme() {
    const dialog = new Promise((resolve, reject) => {
      onSelectSchemeDone = (cmdId) => {
        resolve(cmdId);
      };
      showingSelectScheme = true;
    });
    const cmdId = await dialog;
    console.log("cmdViewScheme:", cmdId);
    if (cmdId) {
      handleMenuCmd(cmdId, null);
    }
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
  async function handleMenuCmd(cmdId, ev) {
    let s = "";
    let stopPropagation = true;
    const fromMenu = !ev;
    let noEditorFocus = false;
    // if invoked from menu we need to give editor focus back
    // unless we're showing a dialog
    switch (cmdId) {
      // those potentially show dialogs
      case m.IDM_FILE_NEW:
      case m.IDT_FILE_NEW:
        cmdFileNew();
        break;
      case m.IDM_EDIT_CLEARDOCUMENT:
        // TODO: ask to save if dirty?
        newEmptyFile();
        break;
      case m.IDM_FILE_OPEN:
      case m.IDT_FILE_OPEN:
        cmdFileOpen();
        break;
      case m.IDM_FILE_OPEN_COMPUTER:
        cmdFileOpenComputer();
        break;
      case m.IDM_FILE_SAVE:
      case m.IDT_FILE_SAVE:
        cmdFileSave();
        break;
      case m.IDM_FILE_SAVEAS:
      case m.IDT_FILE_SAVEAS:
        cmdFileSaveAs();
        break;
      case m.IDM_FILE_BROWSER_SAVEAS:
        cmdFileBrowserSaveAs();
        break;
      case m.IDM_FILE_SAVECOPY:
      case m.IDT_FILE_SAVECOPY:
        cmdFileSaveCopy();
        break;
      case m.IDM_FILE_READONLY_MODE:
        settings.readOnly = !settings.readOnly;
        break;
      case m.IDM_FILE_NEWWINDOW:
        cmdFileNewWindow(file);
        break;
      case m.IDM_FILE_NEWWINDOW2:
        cmdFileNewEmptyWindow();
        break;
      case m.IDM_FILE_ADDTOFAV:
        cmdFileAddToFav();
        break;
      case m.IDM_FILE_OPENFAV:
      case m.IDM_FILE_MANAGEFAV:
        cmdFileOpenFav();
        break;
      case m.IDM_FILE_RECENT:
        cmdFileOpenRecent();
        break;
      case m.IDT_FILE_BROWSE:
      case m.IDM_FILE_BROWSE:
        cmdFileBrowse();
        break;

      case m.IDM_EDIT_GOTOLINE:
        cmdEditGoToLine();
        break;
      case m.IDM_EDIT_ENCLOSESELECTION:
        cmdEncloseSelection();
        break;
      case m.IDM_EDIT_INSERT_XMLTAG:
        cmdInsertXmlTag();
        break;
      case m.IDM_HELP_ABOUT:
        showingAbout = true;
        break;
      case m.IDM_EDIT_DELETELINERIGHT:
        commands.deleteToLineEnd(editorView);
        break;
      case m.IDM_EDIT_DELETELINELEFT:
        commands.deleteToLineStart(editorView);
        break;
      case m.IDM_EDIT_SWAP:
        swapSelectionsWithClipboard(editorView);
        break;
      case m.IDM_EDIT_TRIMLINES:
        deleteTrailingWhitespace(editorView);
        break;
      case m.IDM_EDIT_TRIMLEAD:
        deleteLeadingWhitespace(editorView);
        break;
      case m.IDM_EDIT_STRIP1STCHAR:
        deleteFirstChar(editorView);
        break;
      case m.IDM_EDIT_STRIPLASTCHAR:
        deleteLastChar(editorView);
        break;
      case m.IDM_EDIT_SELECTIONDUPLICATE:
        duplicateSelection(editorView);
        break;
      case m.IDM_EDIT_REMOVEBLANKLINES:
        removeBlankLines(editorView);
        break;
      case m.IDM_EDIT_MERGEBLANKLINES:
        mergeBlankLines(editorView);
        break;
      case m.IDM_EDIT_LINETRANSPOSE:
        transposeLines(editorView);
        break;
      case m.IDM_EDIT_DUPLICATELINE:
        duplicateLine(editorView);
        break;
      case m.IDM_EDIT_CUTLINE:
        cutLine(editorView);
        break;
      case m.IDM_EDIT_COPYLINE:
        copyLine(editorView);
        break;
      case m.IDM_EDIT_DELETELINE:
        commands.deleteLine(editorView);
        break;
      case m.IDM_EDIT_JOINLINES:
        joinLines(editorView);
        break;

      case m.IDM_DUMP_SELECTIONS:
        dumpSelections(editorView);
        break;

      case m.IDM_EDIT_CHAR2HEX:
        replaceSelectionsWith(editorView, charToHex);
        break;
      // case m.IDM_EDIT_HEX2CHAR:
      //   replaceSelectionsWith(editorView, hexToChar);
      //   break;
      case m.IDM_EDIT_SHOW_HEX:
        insertAfterSelection(editorView, showHex);
        break;
      case m.IDM_EDIT_ESCAPECCHARS:
        replaceSelectionsWith(editorView, escapeCChars);
        break;
      case m.IDM_EDIT_UNESCAPECCHARS:
        replaceSelectionsWith(editorView, unescapeCChars);
        break;
      case m.IDM_EDIT_XHTML_ESCAPE_CHAR:
        // TODO: if XML, needs use xhtmlEscapeCharsForXML
        replaceSelectionsWith(editorView, xhtmlEscapeChars);
        break;
      case m.IDM_EDIT_XHTML_UNESCAPE_CHAR:
        // TODO: if XML, needs use xhtmlUnEscapeCharsForXML
        replaceSelectionsWith(editorView, xhtmlUnEscapeChars);
        break;

      case m.IDM_EDIT_SELTODOCSTART:
        selectToDocStart(editorView);
        break;
      case m.IDM_EDIT_SELTODOCEND:
        selectToDocEnd(editorView);
        break;

      case m.IDM_VIEW_HIGHLIGHTCURRENTLINE_NONE:
      case m.IDM_VIEW_HIGHLIGHTCURRENTLINE_BACK:
      case m.IDM_VIEW_HIGHLIGHTCURRENTLINE_FRAME:
        settings.lineHighlightType = cmdId;
        break;
      case m.IDM_VIEW_NOSAVERECENT:
        settings.rememberRecentFiles = !settings.rememberRecentFiles;
        break;
      case m.IDM_VIEW_MENU:
        settings.showMenu = !settings.showMenu;
        break;
      case m.IDM_VIEW_WORDWRAP:
      case m.IDT_VIEW_WORDWRAP:
        settings.wordWrap = !settings.wordWrap;
        break;
      case m.IDM_VIEW_SHOWWHITESPACE:
        settings.showWhitespace = !settings.showWhitespace;
        break;
      case m.IDM_VIEW_SCROLLPASTLASTLINE_NO:
      case m.IDM_VIEW_SCROLLPASTLASTLINE_ONE:
        settings.scrollPastEnd = cmdId;
        break;

      case m.IDM_VIEW_STYLE_THEME_DARK:
        settings.theme = themeNameDark;
        break;
      case m.IDM_VIEW_STYLE_THEME_DEFAULT:
        settings.theme = themeNameDefault;
        break;

      case m.IDM_VIEW_LINENUMBERS:
        settings.showLineNumbers = !settings.showLineNumbers;
        break;
      case m.IDM_VIEW_STATUSBAR:
        settings.showStatusBar = !settings.showStatusBar;
        break;
      case m.IDM_VIEW_TOOLBAR:
        settings.showToolbar = !settings.showToolbar;
        break;
      case m.IDM_SET_MULTIPLE_SELECTION:
        settings.enableMultipleSelection = !settings.enableMultipleSelection;
        break;
      case m.IDM_VIEW_TABSASSPACES:
        settings.tabsAsSpaces = !settings.tabsAsSpaces;
        break;
      case m.IDM_VIEW_MATCHBRACES:
        settings.visualBraceMatching = !settings.visualBraceMatching;
        break;
      case m.IDM_VIEW_SHOW_FOLDING:
        settings.showCodeFolding = !settings.showCodeFolding;
        break;
      case m.IDM_VIEW_SHOWINDENTGUIDES:
        settings.showIndentGuides = !settings.showIndentGuides;
        break;
      case m.IDT_VIEW_TOGGLEFOLDS:
      case m.IDM_VIEW_FOLD_ALL:
        cmdViewToggleFolds();
        break;
      case m.IDM_VIEW_FOLD_CURRENT_BLOCK:
        cmdViewFoldCurrentBlock();
        break;
      case m.IDT_VIEW_SCHEME:
      case m.IDM_VIEW_SCHEME:
        cmdViewScheme();
        break;

      // TODO: notepad2 changes line endings
      // not sure if that transfer to CM as it stores text
      // in lines. Does it re-split the doc when
      // EditorState.lineSeparator changes?
      case m.IDM_LINEENDINGS_CRLF:
        settings.lineSeparator = "\r\n";
        lineSeparatorStatus = "CR+LF";
        break;
      case m.IDM_LINEENDINGS_CR:
        settings.lineSeparator = "\r";
        lineSeparatorStatus = "CR";
        break;
      case m.IDM_LINEENDINGS_LF:
        settings.lineSeparator = "\n";
        lineSeparatorStatus = "LF";
        break;
      case m.CMD_COPYFILENAME_NOEXT:
        copyFileNameToClipboard(1);
        break;
      case m.CMD_COPYFILENAME:
        copyFileNameToClipboard(0);
        break;
      case m.CMD_ENCLOSE_TRIPLE_SQ:
        encloseSelection(editorView, `'''`, `'''`);
        break;
      case m.CMD_ENCLOSE_TRIPLE_DQ:
        encloseSelection(editorView, `"""`, `"""`);
        break;
      case m.CMD_ENCLOSE_TRIPLE_BT:
        encloseSelection(editorView, "```", "```");
        break;
      case m.IDM_EDIT_STREAMCOMMENT:
        commands.blockComment(editorView);
        break;
      case m.IDM_EDIT_MERGEDUPLICATELINE:
        mergeDuplicateLines(editorView);
        break;
      case m.IDM_EDIT_REMOVEDUPLICATELINE:
        deleteDuplicateLines(editorView);
        break;
      case m.IDM_EDIT_PADWITHSPACES:
        padWithSpaces(editorView);
        break;
      case m.IDM_EDIT_COMPRESSWS:
        compressWhitespace(editorView);
        break;
      case m.IDM_EDIT_BASE64_ENCODE:
        cmdBase64EncodeStandard(editorView);
        break;
      case m.IDM_EDIT_BASE64_SAFE_ENCODE:
        cmdBase64EncodeURLSafe(editorView);
        break;
      case m.IDM_EDIT_BASE64_HTML_EMBEDDED_IMAGE:
        cmdBase64EncodeHtmlImage(editorView);
        break;
      case m.IDM_EDIT_BASE64_DECODE:
        cmdBase64Decode(editorView);
        break;
      case m.IDM_EDIT_BASE64_DECODE_AS_HEX:
        cmdBase64DecodeAsHex(editorView);
        break;
      case m.IDM_EDIT_URLENCODE:
        cmdUrlEncode(editorView);
        break;
      case m.IDM_EDIT_URLDECODE:
        cmdUrlDecode(editorView);
        break;
      case m.IDM_EDIT_CONVERTUPPERCASE:
        replaceSelectionsWith(editorView, convertUpperCase);
        break;
      case m.IDM_EDIT_CONVERTLOWERCASE:
        replaceSelectionsWith(editorView, convertLowerCase);
        break;
      case m.IDM_EDIT_INVERTCASE:
        replaceSelectionsWith(editorView, invertCase);
        break;
      case m.IDM_EDIT_TITLECASE:
        replaceSelectionsWith(editorView, titleCase);
        break;
      // case m.IDM_EDIT_SENTENCECASE:
      //   break;
      // case m.IDM_EDIT_CONVERTSPACES:
      //   break;
      // case m.IDM_EDIT_CONVERTTABS:
      //   break;
      // case m.IDM_EDIT_CONVERTSPACES2:
      //   break;
      // case m.IDM_EDIT_CONVERTTABS2:
      //   break;
      case m.IDM_EDIT_NUM2HEX:
        replaceSelectionsWith(editorView, toHex);
        break;
      case m.IDM_EDIT_NUM2DEC:
        replaceSelectionsWith(editorView, toDec);
        break;
      case m.IDM_EDIT_NUM2BIN:
        replaceSelectionsWith(editorView, toBin);
        break;
      case m.IDM_EDIT_NUM2OCT:
        replaceSelectionsWith(editorView, toOct);
        break;
      case m.IDM_EDIT_INSERT_LOC_DATE:
        insertText(editorView, getCurrentDate);
        break;
      case m.IDM_EDIT_INSERT_LOC_DATETIME:
        insertText(editorView, getCurrentDateTime);
        break;
      case m.IDM_EDIT_INSERT_UTC_DATETIME:
        insertText(editorView, getUTCDate);
        break;
      case m.IDM_EDIT_INSERT_TIMESTAMP:
        insertText(editorView, getUnixTimestampSeconds);
        break;
      case m.IDM_EDIT_INSERT_TIMESTAMP_MS:
        insertText(editorView, getUnixTimestampMs);
        break;
      case m.IDM_EDIT_INSERT_TIMESTAMP_US:
        insertText(editorView, getUnixTimestampUs);
        break;
      case m.IDM_EDIT_INSERT_SHORTDATE:
        insertText(editorView, getShortDate);
        break;
      case m.IDM_EDIT_INSERT_LONGDATE:
        insertText(editorView, getLongDate);
        break;
      case m.IDM_VIEW_SHOWFILENAMEONLY:
      // case m.IDM_VIEW_SHOWFILENAMEFIRST:
      // case m.IDM_VIEW_SHOWFULLPATH:
      case m.IDM_VIEW_SHOWEXCERPT:
        fileNameDisplay = cmdId;
        if (cmdId === m.IDM_VIEW_SHOWEXCERPT) {
          s = getCurrentSelection(128);
          fileNameExcerpt = `"` + sanitizeString(s) + `"`;
        }
        break;

      case m.IDM_EDIT_INSERT_GUID:
        insertText(editorView, uuidv4);
        break;
      case m.IDM_INSERT_UNICODE_WJ:
      case m.IDM_INSERT_UNICODE_ZWJ:
      case m.IDM_INSERT_UNICODE_ZWNJ:
      case m.IDM_INSERT_UNICODE_LRM:
      case m.IDM_INSERT_UNICODE_RLM:
      case m.IDM_INSERT_UNICODE_LRE:
      case m.IDM_INSERT_UNICODE_RLE:
      case m.IDM_INSERT_UNICODE_LRO:
      case m.IDM_INSERT_UNICODE_RLO:
      case m.IDM_INSERT_UNICODE_LRI:
      case m.IDM_INSERT_UNICODE_RLI:
      case m.IDM_INSERT_UNICODE_FSI:
      case m.IDM_INSERT_UNICODE_PDI:
      case m.IDM_INSERT_UNICODE_PDF:
      case m.IDM_INSERT_UNICODE_NADS:
      case m.IDM_INSERT_UNICODE_NODS:
      case m.IDM_INSERT_UNICODE_ASS:
      case m.IDM_INSERT_UNICODE_ISS:
      case m.IDM_INSERT_UNICODE_AAFS:
      case m.IDM_INSERT_UNICODE_IAFS:
      case m.IDM_INSERT_UNICODE_ALM:
      case m.IDM_INSERT_UNICODE_RS:
      case m.IDM_INSERT_UNICODE_US:
      case m.IDM_INSERT_UNICODE_LS:
      case m.IDM_INSERT_UNICODE_PS:
      case m.IDM_INSERT_UNICODE_ZWSP:
        s = findUnicodeStrByMenuID(cmdId);
        insertText(editorView, s);
        break;
      case m.IDM_EDIT_INSERT_FILENAME:
        insertText(editorView, getFileName(0));
        break;
      case m.CMD_INSERTFILENAME_NOEXT:
        insertText(editorView, getFileName(1));
        break;
      // case m.IDM_EDIT_INSERT_PATHNAME:
      //   insertText(editorView, getFileName(2));
      //   break;
      case m.CMD_ONLINE_SEARCH_GOOGLE:
        launchSelectionWithGoogle();
        break;
      case m.CMD_ONLINE_SEARCH_BING:
        launchSelectionWithBing();
        break;
      case m.CMD_ONLINE_SEARCH_WIKI:
        launchSelectionWithWikipedia();
        break;
      case m.CMD_JUMP2SELSTART:
        goToSelectionStartEnd(editorView, false);
        break;
      case m.CMD_JUMP2SELEND:
        goToSelectionStartEnd(editorView, true);
        break;

      // those are handled by CodeMirror
      case m.IDM_EDIT_COPY:
      case m.IDT_EDIT_COPY:
      case m.IDM_EDIT_CUT:
      case m.IDT_EDIT_CUT:
      case m.IDT_EDIT_CUT:
      case m.IDM_EDIT_PASTE:
      case m.IDT_EDIT_PASTE:
      case m.IDM_EDIT_SELECTALL:
      case m.IDM_EDIT_UNDO:
      case m.IDT_EDIT_UNDO:
      case m.IDM_EDIT_REDO:
      case m.IDT_EDIT_REDO:
      case m.IDM_VIEW_TOGGLE_FULLSCREEN:
      case m.IDM_EDIT_INDENT:
      case m.IDM_EDIT_UNINDENT:
      case m.IDM_EDIT_MOVELINEDOWN:
      case m.IDM_EDIT_MOVELINEUP:
      case m.IDM_EDIT_LINECOMMENT:
      case m.CMD_CTRLBACK:
      case m.CMD_CTRLDEL:
      case m.IDM_EDIT_FIND: // TODO: custom dialog
      case m.IDM_EDIT_FINDNEXT:
      case m.IDM_EDIT_FINDPREV:
      case m.IDM_EDIT_REPLACE:
        if (ev) {
          // if invoked via keyboard, CodeMirror has already handled it
          stopPropagation = false;
        } else {
          switch (cmdId) {
            case m.IDM_VIEW_TOGGLE_FULLSCREEN:
              toggleFullScreen();
              break;
            case m.IDM_EDIT_CUT:
            case m.IDT_EDIT_CUT:
              document.execCommand("cut");
              break;
            case m.IDT_EDIT_COPY:
            case m.IDM_EDIT_COPY:
              document.execCommand("copy");
              break;
            case m.IDM_EDIT_PASTE:
            case m.IDT_EDIT_PASTE:
              cmdEditPaste();
              break;
            case m.IDM_EDIT_INDENT:
              commands.indentMore(editorView);
              break;
            case m.IDM_EDIT_UNINDENT:
              commands.indentLess(editorView);
              break;
            case m.IDM_EDIT_SELECTALL:
              commands.selectAll(editorView);
              break;
            case m.IDM_EDIT_UNDO:
            case m.IDT_EDIT_UNDO:
              commands.undo(editorView);
              break;
            case m.IDM_EDIT_REDO:
            case m.IDT_EDIT_REDO:
              commands.redo(editorView);
              break;
            case m.IDM_EDIT_MOVELINEDOWN:
              commands.moveLineDown(editorView);
              break;
            case m.IDM_EDIT_MOVELINEUP:
              commands.moveLineUp(editorView);
              break;
            case m.IDM_EDIT_LINECOMMENT:
              commands.toggleComment(editorView);
              break;
            default:
              // TODO: not handled
              msgNotImplemented = `Command ${cmdId} not yet implemented!`;
              showingMsgNotImplemented = true;
          }
        }
        break;
      case m.IDT_EDIT_FIND:
      case m.IDM_EDIT_FIND:
      case m.IDT_EDIT_REPLACE:
      case m.IDM_EDIT_REPLACE:
        openSearchPanel(editorView);
        noEditorFocus = true;
        break;
      case m.IDM_EDIT_DELETE:
      case m.IDT_EDIT_DELETE:
        // TODO: possibly deleteCharBackward()
        commands.deleteCharForward(editorView);
        break;
      case m.IDM_EDIT_COPYALL:
        // copy the whole text to clipbard
        s = editorView.state.doc.toString();
        setClipboard(s);
        break;
      case m.IDM_EDIT_COPYADD:
        let sel = getCurrentSelectionAsText();
        if (sel !== "") {
          // Document must be focused for setting clipboard
          // TODO: more reliable way
          setTimeout(() => {
            appendClipboard(sel);
          }, 500);
        }
        break;
      case m.IDM_EDIT_CLEARCLIPBOARD:
        clearClipboard();
        break;
      case m.IDM_HELP_PROJECT_HOME:
        window.open("https://tools.arslexis.io/docs/notepad2", "_blank");
        break;
      case m.IDM_HELP_REPORT_ISSUE:
      case m.IDM_HELP_FEATURE_REQUEST:
        window.open(
          "https://github.com/kjk/tools.arslexis.io/labels/notepad2",
          "_blank"
        );
        break;
      case m.IDM_HELP_SOURCE_CODE:
        window.open("https://github.com/kjk/tools.arslexis.io", "_blank");
        break;
      case m.IDM_HELP_DISCUSS:
        window.open(
          "https://github.com/kjk/tools.arslexis.io/discussions/categories/notepad2",
          "_blank"
        );
        break;
      default:
        if (cmdId === m.IDM_LEXER_TEXTFILE) {
          lexerId = cmdId;
          break;
        }
        let lex = await getCMLangFromLexer(cmdId);
        if (lex) {
          lexerId = cmdId;
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
      case m.IDM_EDIT_CUT:
      case m.IDT_EDIT_CUT:
      case m.IDM_EDIT_COPY:
      case m.IDT_EDIT_COPY:
      case m.IDM_EDIT_COPYADD:
      case m.IDM_EDIT_CLEARCLIPBOARD:
      case m.IDM_EDIT_CONVERTUPPERCASE:
      case m.IDM_EDIT_CONVERTLOWERCASE:
      case m.IDM_EDIT_INVERTCASE:
      case m.IDM_EDIT_TITLECASE:
      case m.IDM_EDIT_SENTENCECASE:
      case m.IDM_EDIT_CONVERTSPACES:
      case m.IDM_EDIT_CONVERTTABS:
      case m.IDM_EDIT_CONVERTSPACES2:
      case m.IDM_EDIT_CONVERTTABS2:
      case m.IDM_EDIT_NUM2HEX:
      case m.IDM_EDIT_NUM2DEC:
      case m.IDM_EDIT_NUM2BIN:
      case m.IDM_EDIT_NUM2OCT:
      case m.CMD_ONLINE_SEARCH_GOOGLE:
      case m.CMD_ONLINE_SEARCH_BING:
      case m.CMD_ONLINE_SEARCH_WIKI:
      case m.IDM_EDIT_BASE64_ENCODE:
      case m.IDM_EDIT_BASE64_SAFE_ENCODE:
      case m.IDM_EDIT_BASE64_HTML_EMBEDDED_IMAGE:
      case m.IDM_EDIT_BASE64_DECODE:
      case m.IDM_EDIT_BASE64_DECODE_AS_HEX:
      case m.CMD_CUSTOM_ACTION1:
      case m.CMD_CUSTOM_ACTION2:
      case m.IDM_EDIT_URLENCODE:
      case m.IDM_EDIT_URLDECODE:
      case m.IDM_EDIT_SELECTIONDUPLICATE:
      case m.IDM_EDIT_SORTLINES:
      case m.IDM_EDIT_JOINLINES:
      case m.IDM_EDIT_COLUMNWRAP:
      case m.IDM_EDIT_SPLITLINES:
      case m.IDM_EDIT_JOINLINESEX:
      case m.IDM_VIEW_SHOWEXCERPT:
      case m.CMD_ONLINE_SEARCH_GOOGLE:
      case m.CMD_ONLINE_SEARCH_BING:
      case m.CMD_ONLINE_SEARCH_WIKI:
      case m.IDM_EDIT_CHAR2HEX:
      case m.IDM_EDIT_HEX2CHAR:
      case m.IDM_EDIT_SHOW_HEX:
      case m.IDM_EDIT_ESCAPECCHARS:
      case m.IDM_EDIT_UNESCAPECCHARS:
      case m.IDM_EDIT_XHTML_ESCAPE_CHAR:
      case m.IDM_EDIT_XHTML_UNESCAPE_CHAR:
        // console.log("isMenuEnabled:", cmdId, "hasSelection:", hasSelection);
        return hasSelection;

      case m.IDM_EDIT_COPYALL:
        return editorView.state.doc.length > 0;

      case m.IDM_EDIT_PASTE:
      case m.IDT_EDIT_PASTE:
        return hasClipboard;

      case m.IDM_EDIT_UNDO:
      case m.IDT_EDIT_UNDO:
        n = commands.undoDepth(state);
        return n > 0;

      case m.IDM_EDIT_REDO:
      case m.IDT_EDIT_REDO:
        n = commands.redoDepth(state);
        return n > 0;

      case m.IDM_EDIT_SWAP:
        return hasSelection && hasClipboard;

      case m.IDM_FILE_SAVE:
      case m.IDT_FILE_SAVE:
        return isDirty;

      case m.IDM_FILE_ADDTOFAV:
        return file != null;

      case m.IDM_EDIT_LINETRANSPOSE:
        // TODO: if not at first line
        break;
    }
    return true;
  }

  function isMenuChecked(cmdId) {
    switch (cmdId) {
      case m.IDM_VIEW_MENU:
        return settings.showMenu;
      case m.IDM_VIEW_WORDWRAP:
        return settings.wordWrap;
      case m.IDM_FILE_READONLY_MODE:
        return settings.readOnly;
      case m.IDM_VIEW_LINENUMBERS:
        return settings.showLineNumbers;
      case m.IDM_VIEW_STATUSBAR:
        return settings.showStatusBar;
      case m.IDM_VIEW_TOOLBAR:
        return settings.showToolbar;
      case m.IDM_LINEENDINGS_CRLF:
        return settings.lineSeparator === "\r\n";
      case m.IDM_LINEENDINGS_LF:
        return settings.lineSeparator === "\n";
      case m.IDM_LINEENDINGS_CR:
        return settings.lineSeparator === "\r";
      case m.IDM_VIEW_SHOWWHITESPACE:
        return settings.showWhitespace;
      case m.IDM_SET_MULTIPLE_SELECTION:
        return settings.enableMultipleSelection;
      case m.IDM_VIEW_TABSASSPACES:
        return settings.tabsAsSpaces;
      case m.IDM_VIEW_SHOWFILENAMEONLY:
      case m.IDM_VIEW_SHOWEXCERPT:
        return fileNameDisplay === cmdId;
      case m.IDM_VIEW_MATCHBRACES:
        return settings.visualBraceMatching;
      case m.IDM_VIEW_NOSAVERECENT:
        return settings.rememberRecentFiles;
      case m.IDM_VIEW_HIGHLIGHTCURRENTLINE_NONE:
      case m.IDM_VIEW_HIGHLIGHTCURRENTLINE_BACK:
      case m.IDM_VIEW_HIGHLIGHTCURRENTLINE_FRAME:
        return settings.lineHighlightType === cmdId;
      case m.IDM_VIEW_SCROLLPASTLASTLINE_NO:
      case m.IDM_VIEW_SCROLLPASTLASTLINE_ONE:
        return settings.scrollPastEnd === cmdId;
      case m.IDM_VIEW_SHOW_FOLDING:
        return settings.showCodeFolding;
      case m.IDM_VIEW_SHOWINDENTGUIDES:
        return settings.showIndentGuides;
      case m.IDM_VIEW_STYLE_THEME_DARK:
        return settings.theme === themeNameDark;
      case m.IDM_VIEW_STYLE_THEME_DEFAULT:
        return settings.theme === themeNameDefault;
    }
    return false;
  }

  async function openInitialFile() {
    // if has ?file=${fileID}, opens that
    // otherwise, opens empty file
    let params = new URLSearchParams(location.search);
    let fileId = params.get("file");
    if (!fileId) {
      newEmptyFile();
      return;
    }
    locationRemoveSearchParamsNoReload();
    let file;
    if (fileId === "__for_new_window") {
      file = await getAndClearFileForNewWindow();
      console.log("openInitialFile: got __for_new_window file:", file);
    } else {
      file = deserialize(fileId);
    }
    if (file) {
      await setFileAsCurrent(file);
    }
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
    let blob = await first.file;
    let name = first.file.name;
    let fs = newIndexedDBFile(name);
    writeFile(fs, blob);
    setFileAsCurrent(fs);
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
        hidden={false}
        filterFn={filterMenuItem}
        menuDidOpenFn={handleMenuDidOpen}
        menuBar={m.mainMenuBar}
        noMenuCommands={m.noMenuCommands}
        onmenucmd={handleMenuCmd}
      />
      <div
        class="truncate border-l border-gray-500 font-semibold text-gray-900 pl-2"
      >
        {shownFileName}
      </div>
      <div class="grow"></div>
      <a
        class="px-1 py-1 mr-1 hover:underline text-xs"
        href="https://github.com/kjk/tools.arslexis.io/discussions"
        target="_blank"
        rel="noreferrer"
      >
        feedback
      </a>
      <a
        class="px-1 py-1 mr-1 hover:bg-gray-100"
        href="https://github.com/kjk/tools.arslexis.io"
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
        filterFn={filterMenuItem}
        menuDidOpenFn={handleMenuDidOpen}
        menuBar={m.mainMenuBar}
        noMenuCommands={m.noMenuCommands}
        onmenucmd={handleMenuCmd}
      />
      <div class="absolute flex top-[2px] right-[4px] text-sm">
        <div class="py-0.5 truncate font-semibold text-gray-900 border-l">
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
    bind:wordWrap={settings.wordWrap}
    {isMenuEnabled}
    {handleMenuCmd}
  />
  <div class="min-h-0 overflow-hidden">
    <div
      class="codemirror-wrapper overflow-auto flex-grow bg-transparent"
      bind:this={editorElement}
    ></div>
  </div>

  {#if settings.showStatusBar}
    <div class="flex justify-between px-2 bg-gray-50 text-sm gap-4">
      <div>Ln {statusLn1} / {statusLn2}</div>
      <div>Col {statusCol1} / {statusCol2}</div>
      <div>Sel {statusSel} Sel Ln {statusSelLn}</div>
      <div class="grow"></div>
      <div>{statusLang}</div>
      <div>{statusEncoding}</div>
      <div>{lineSeparatorStatus}</div>
      <div>{notepad2Size(statusSize)}</div>
    </div>
  {:else}
    <div></div>
  {/if}
</main>

<!-- needs to re-mount -->
{#if showingOpenFile}
  <DialogFileOpen bind:open={showingOpenFile} onDone={onOpenFileDone} />
{/if}

<!-- needs to re-mount -->
{#if showingSaveAs}
  <DialogSaveAs
    bind:open={showingSaveAs}
    name={saveAsName}
    onDone={onSaveAsDone}
  />
{/if}

<DialogBrowse
  closeOnFileOpen={fileBrowseCloseOnFileOpen}
  bind:open={showingFileBrowse}
  bind:title={fileBrowseTitle}
  onDone={onFileBrowseDone}
/>

<DialogAskSaveChanges
  bind:open={showingAskSaveChanges}
  name={askSaveChangesName}
  onDone={onAskSaveChangesDone}
/>

<DialogFind bind:open={showingFind} />

<DialogGoTo bind:open={showingGoTo} onDone={onGoToDone} maxLine={goToMaxLine} />

<DialogAddFavorite
  bind:open={showingAddToFavorites}
  {name}
  onDone={onAddToFavoritesDone}
/>

<!-- need to mount / unmount -->
{#if showingFavorites}
  <DialogFavorites
    bind:open={showingFavorites}
    bind:rememberRecentFiles={settings.rememberRecentFiles}
    type={favoritesType}
    onDone={onFavoritesDone}
  />
{/if}

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

<DialogSelectScheme
  bind:open={showingSelectScheme}
  onDone={onSelectSchemeDone}
/>

<Messages />
<Progress />

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
    font-size: 10pt;
  }
</style>
