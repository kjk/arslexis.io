<script context="module">
  /** @typedef { import("@codemirror/state").Extension} Extension */
  /** @typedef { import("@codemirror/state").Transaction} Transaction */
  /** @typedef { import("@codemirror/language").LanguageSupport} LanguageSupport */
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
  } from "./menu-notepad2";
  import { EditorView, lineNumbers } from "@codemirror/view";
  import { EditorState, Compartment } from "@codemirror/state";
  import * as commands from "@codemirror/commands";
  import { getTheme, getBaseExtensions2 } from "../cmexts";

  import { focusEditorView, getLangFromFileName } from "../cmutil";
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
    requestFullScreen,
    toggleFullScreen,
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
  let statusNewline = "CR+LF";
  let statusLang = "Text";

  let showingAbout = false;

  /** @typedef {import("@codemirror/state").EditorSelection} EditorSelection */
  /** @typedef {import("@codemirror/state").SelectionRange} SelectionRange */
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

  let readOnly = false;
  let readOnlyCompartment = new Compartment();
  $: setReadOnlyState(readOnly);
  /**
   * @param {boolean} flag
   */
  function setReadOnlyState(flag) {
    if (editorView) {
      editorView.dispatch({
        effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(flag)),
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

  let wordWrap = false;
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
    console.log("handleMenuDidOpen:", menuElement);
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
    let basic = true;
    let theme = undefined;
    let useTab = true;
    let tabSize = 2;
    let styles = undefined;
    let editable = true;
    let placeholder = "start typing or menu `File/Open` or drag & drop file...";
    /** @type {Extension[]}*/

    // TODO: why is this [] and not null or something?
    // @ts-ignore
    let wordWrapV = wordWrap ? EditorView.lineWrapping : [];
    let lineNumV = showLineNumbers ? lineNumbers() : [];
    const exts = [
      ...getBaseExtensions2(basic, useTab, tabSize, placeholder, editable),
      readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),
      wordWrapCompartment.of(wordWrapV),
      showLineNumbersCompartment.of(lineNumV),
      ...getTheme(theme, styles),
    ];
    const lang = /** @type {LanguageSupport} */ (getLangFromFileName(fileName));
    statusLang = "Text";
    if (lang) {
      exts.push(lang);
      console.log("lang:", lang);
      // @ts-ignore
      if (lang.name) {
        // @ts-ignore
        statusLang = lang.name;
      } else if (lang.language && lang.language.name) {
        statusLang = lang.language.name;
      }
    }
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
      case IDM_EDIT_SWAP:
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
      case CMD_CUSTOM_ACTION1:
      case CMD_CUSTOM_ACTION2:
        // console.log("isMenuEnabled:", cmdId, "hasSelection:", hasSelection);
        return hasSelection;
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
    }
    return false;
  }

  // this can be invoked via keyboard shortcut of via menu
  // if via keyboard, arg.detail.ev is set
  // TODO: if via menu, we need to be smart about closeMen() vs. closeMenuAndFocusEditor()
  async function handleMenuCmd(arg) {
    const cmdId = arg.detail.cmd;
    const ev = arg.detail.ev;
    console.log("handleMenuCmd:", cmdId);
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
        if (ev) {
          // do nothing, let it fall to CodeMirror
          stopPropagation = false;
        } else {
          let v = editorView;
          let state = v.state;
          let dispatch = v.dispatch;
          let args = { state, dispatch };
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
            case IDM_EDIT_SELECTALL:
              commands.selectAll(args);
              break;
            case IDM_EDIT_UNDO:
            case IDT_EDIT_UNDO:
              commands.undo(args);
              break;
            case IDM_EDIT_REDO:
            case IDT_EDIT_REDO:
              commands.redo(args);
              break;
            default:
              // TODO: not handled
              msgNotImplemented = `Command ${cmdId} not yet implemented!`;
              showingMsgNotImplemented = true;
          }
        }
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
    24, 0, 13, 14, 0, 15, 16, 0,
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
    <div class="flex justify-between px-2 bg-gray-50 text-sm">
      <div>Ln {statusLn1} / {statusLn2}</div>
      <div>Col {statusCol1} / {statusCol2}</div>
      <div>Sel {statusSel} Sel Ln {statusSelLn}</div>
      <div>{notepad2Size(statusSize)}</div>
      <div>{statusEncoding}</div>
      <div>{statusNewline}</div>
      <div>{statusLang}</div>
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
