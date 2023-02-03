<script context="module">
  /** @typedef { import("@codemirror/state").Extension} Extension */
</script>

<script>
  import MenuBar2 from "../MenuBar2.svelte";
  import {
    IDM_HELP_ABOUT,
    IDM_VIEW_WORDWRAP,
    mainMenuBar,
  } from "./menu-notepad2";
  import { EditorView } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import {
    focusEditorView,
    getBaseExtensions,
    getLangFromFileName,
    getTheme,
  } from "../cmutil";
  import { debounce, throwIf } from "../util.js";
  import { onDestroy, onMount } from "svelte";

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

  function newFile() {
    console.log("newFile");
  }

  function createEditorView() {
    throwIf(!editorElement);

    function handleEditorChange(tr) {
      // must re-render tabs to show change indicator
    }

    /** @type {Function} */
    const changeFn = debounce(handleEditorChange, 300);

    function dispatchTransaction(tr) {
      editorView.update([tr]);

      if (tr.docChanged) {
        changeFn(tr);
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
    if (cmdId === IDM_HELP_ABOUT) {
      // just for testing
      return false;
    }
    return true;
  }

  function isMenuChecked(cmdId) {
    if (cmdId === IDM_HELP_ABOUT) {
      // just for testing
      return true;
    }
    if (cmdId === IDM_VIEW_WORDWRAP) {
      return wordWrap;
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
    let readonly = false;
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
        readonly
      ),
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

  function closeMenu() {
    let el = document.activeElement;
    if (!el) {
      return;
    }
    // TODO: do nothing if el is not menu

    // just blur() looses editor focus
    /** @type {HTMLElement}*/ (el).blur();
    focusEditorView(editorView);
  }

  function handleMenuCmd(cmd) {
    const cmdId = cmd.detail;
    console.log("handleMenuCmd:", cmdId);
    if (cmdId === IDM_VIEW_WORDWRAP) {
      wordWrap = !wordWrap;
    }
    closeMenu();
  }

  function handleOnMount() {
    editorView = createEditorView();
    let state = createEditorState("");
    editorView.setState(state);
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
  <MenuBar2
    menuDidOpenFn={handleMenuDidOpen}
    menuBar={mainMenuBar}
    on:menucmd={handleMenuCmd}
  />
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
</main>

<style>
  main {
    grid-template-rows: auto 1fr auto;
  }

  :global(editor) {
    overflow: hidden;
  }
</style>
