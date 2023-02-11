<script context="module">
  /** @typedef { import("@codemirror/state").Extension} Extension */
  /** @typedef { import("@codemirror/state").Transaction} Transaction */
</script>

<script>
  import MenuBar2 from "../MenuBar2.svelte";
  import {
    IDM_EDIT_CLEARDOCUMENT,
    IDM_EDIT_CONVERTLOWERCASE,
    IDM_EDIT_CONVERTSPACES,
    IDM_EDIT_CONVERTSPACES2,
    IDM_EDIT_CONVERTTABS,
    IDM_EDIT_CONVERTTABS2,
    IDM_EDIT_CONVERTUPPERCASE,
    IDM_EDIT_COPY,
    IDM_EDIT_INVERTCASE,
    IDM_EDIT_NUM2BIN,
    IDM_EDIT_NUM2DEC,
    IDM_EDIT_NUM2HEX,
    IDM_EDIT_NUM2OCT,
    IDM_EDIT_SENTENCECASE,
    IDM_EDIT_TITLECASE,
    IDM_FILE_NEW,
    IDM_FILE_OPEN,
    IDM_FILE_READONLY_MODE,
    IDM_FILE_SAVE,
    IDM_FILE_SAVEAS,
    IDM_HELP_ABOUT,
    IDM_HELP_FEATURE_REQUEST,
    IDM_HELP_PROJECT_HOME,
    IDM_HELP_REPORT_ISSUE,
    IDM_VIEW_WORDWRAP,
    mainMenuBar,
  } from "./menu-notepad2";
  import { EditorView } from "@codemirror/view";
  import { EditorState, Compartment } from "@codemirror/state";
  import {
    editorViewSetReadOnly,
    focusEditorView,
    getBaseExtensions,
    getLangFromFileName,
    getTheme,
  } from "../cmutil";
  import { debounce, len, throwIf } from "../util.js";
  import { onDestroy, onMount } from "svelte";
  import { tooltip } from "../actions/tooltip";
  import DialogAskSaveChanges from "./DialogAskSaveChanges.svelte";
  import DialogNotImplemented from "./DialogNotImplemented.svelte";
  import DialogSaveAs from "./DialogSaveAs.svelte";
  import DialogFileOpen from "./DialogFileOpen.svelte";
  import { FsFile, readFile, saveFile } from "./FsFile";

  /** @type {HTMLElement} */
  let editorElement = null;
  /** @type {EditorView} */
  let editorView = null;

  // state of current document
  let normalLength = 40;
  let lineCount = 4;
  let posLine = 4;
  let posCol = 1;
  let pos = 41;
  let lineEncoding = "Windows (CRLF)";
  let charEncoding = "UTF-8";
  let typingMode = "INS"; // OVR
  let wordWrap = true;

  /** @typedef {import("@codemirror/state").EditorSelection} EditorSelection */
  /** @typedef {import("@codemirror/state").SelectionRange} SelectionRange */
  /** @type {EditorSelection} */
  let currSelection = null;
  let hasSelection = false;
  $: updateSelectionState(currSelection);
  /**
   * @param {EditorSelection} sel
   */
  function updateSelectionState(sel) {
    hasSelection = false;
    if (!sel) {
      return;
    }
    let n = len(sel.ranges);
    for (let i = 0; i < n; i++) {
      const r = sel.ranges[i];
      if (!r.empty) {
        hasSelection = true;
        break;
      }
    }
    console.log("hasSelection:", hasSelection);
  }

  let readOnly = false;
  let readOnlyCompartment = new Compartment();
  $: setReadOnlyState(readOnly);

  /**
   * @param {boolean} ro
   */
  function setReadOnlyState(ro) {
    if (!editorView) {
      // might be called before creating view
      return;
    }
    editorViewSetReadOnly(editorView, readOnlyCompartment, ro);
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
  }

  /**
   * @param {FsFile} fileIn
   */
  function handleSaveAs(fileIn) {
    console.log("handleSaveAs:", fileIn);
    initialState = editorView.state;
    let content = initialState.doc.toString();
    saveFile(fileIn, content);
    focusEditorView(editorView);
    isDirty = false;
    file = fileIn;
    name = file.name;
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
    }

    return new EditorView({
      parent: editorElement,
      dispatch: dispatchTransaction,
    });
  }

  /**
   * return false if a given cmd should be disabled
   * based on the state of the app
   * @param {string} cmdId
   */
  function isMenuEnabled(cmdId) {
    switch (cmdId) {
      // TODO: much more that depend on selection state
      case IDM_EDIT_COPY:
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
        return hasSelection;
      case IDM_HELP_ABOUT:
        break;
    }
    return true;
  }

  function isMenuChecked(cmdId) {
    switch (cmdId) {
      case IDM_VIEW_WORDWRAP:
        return wordWrap;
      case IDM_FILE_READONLY_MODE:
        return readOnly;
    }
    return false;
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
    let lineWrapping = false;
    let editable = true;
    let placeholder = "start typing...";
    /** @type {Extension[]}*/
    const exts = [
      ...getBaseExtensions(
        basic,
        useTab,
        tabSize,
        lineWrapping,
        placeholder,
        editable,
        false
      ),
      readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),
      ...getTheme(theme, styles),
    ];
    const lang = getLangFromFileName(fileName);
    if (lang) {
      exts.push(lang);
    }
    return EditorState.create({
      doc: s ?? undefined,
      extensions: exts,
    });
  }

  function closeMenuAndFocusEditor() {
    let el = document.activeElement;
    if (!el) {
      return;
    }
    // TODO: do nothing if el is not menu

    // just blur() looses editor focus
    /** @type {HTMLElement}*/ (el).blur();
    focusEditorView(editorView);
  }

  function closeMenu() {
    let el = document.activeElement;
    if (!el) {
      return;
    }
    // TODO: do nothing if el is not menu
    /** @type {HTMLElement}*/ (el).blur();
  }

  function newEmptyFile() {
    file = null;
    name = "Untitled";
    initialState = createEditorState("");
    editorView.setState(initialState);
    isDirty = false;
  }

  // this can be invoked via keyboard shortcut of via menu
  // TODO: if via menu, we need to be smart about closeMen() vs. closeMenuAndFocusEditor()
  function handleMenuCmd(cmd) {
    const cmdId = cmd.detail;
    console.log("handleMenuCmd:", cmdId);
    switch (cmdId) {
      case IDM_FILE_NEW:
        if (isDirty) {
          // TODO: ask if should save changes
        }
        newEmptyFile();
        focusEditorView(editorView);
        break;
      case IDM_FILE_OPEN:
        showingOpenFile = true;
        // TODO: more
        break;
      case IDM_FILE_SAVE:
        if (file === null) {
          // TODO: need to provide callback to call when saving a file
          showingSaveAs = true;
        } else {
          handleSaveAs(file);
        }
        break;
      case IDM_FILE_SAVEAS:
        showingSaveAs = true;
        break;
      case IDM_VIEW_WORDWRAP:
        wordWrap = !wordWrap;
        break;
      case IDM_FILE_READONLY_MODE:
        readOnly = !readOnly;
        break;
      case IDM_EDIT_CLEARDOCUMENT:
        // TODO: ask to save if dirty?
        newEmptyFile();
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
        // TODO: not handled
        msgNotImplemented = `Command ${cmdId} not yet implemented!`;
        showingMsgNotImplemented = true;
    }
    closeMenu();
  }

  function handleOnMount() {
    editorView = createEditorView();
    newEmptyFile();
    // document.addEventListener("keydown", onKeyDown);
    focusEditorView(editorView);
  }
  onMount(handleOnMount);

  onDestroy(() => {
    editorView = null;
    // document.removeEventListener("keydown", onKeyDown);
  });
</script>

<main class="fixed inset-0 grid">
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
    <MenuBar2
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

  <div class="min-h-0 overflow-hidden">
    <div
      class="codemirror-wrapper overflow-auto flex-grow bg-transparent"
      bind:this={editorElement}
    />
  </div>

  <div class="flex justify-between px-2 bg-gray-50">
    <div>Normal length: {normalLength}</div>
    <div>Lines: {lineCount}</div>
    <div>Ln: {posLine} Col: {posCol} Pos: {pos}</div>
    <div>{lineEncoding}</div>
    <div>{charEncoding}</div>
    <div>{typingMode}</div>
  </div>

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

  <DialogNotImplemented
    bind:open={showingMsgNotImplemented}
    msg={msgNotImplemented}
  />
</main>

<style>
  main {
    grid-template-rows: auto 1fr auto;
  }

  :global(editor) {
    overflow: hidden;
  }
</style>
