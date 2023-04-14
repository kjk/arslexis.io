<script>
  /** @typedef { import("@codemirror/state").Extension} Extension */

  import {
    EditorView,
    keymap,
    placeholder as placeholderExt,
  } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import { debounce, throwIf } from "../util";
  import { basicSetup2 } from "../cmexts";
  import { getCMLangFromFileName } from "../cmlangs";
  import { onMount } from "svelte";
  import { indentUnit } from "@codemirror/language";
  import { indentWithTab } from "@codemirror/commands";
  import { focusEditorView } from "../cmutil";

  /** @type {HTMLElement} */
  let editorElement = null;
  /** @type {EditorView} */
  let editorView = null;
  let outputMsg = "";
  let statusMsg = "";
  let errorMsg = "";

  function clearOutput() {
    outputMsg = "";
    errorMsg = "";
  }

  function createEditorView() {
    throwIf(!editorElement);

    function handleEditorChange(tr) {}

    /** @type {Function} */
    const changeFn = debounce(handleEditorChange, 300);

    function dispatchTransaction(tr) {
      editorView.update([tr]);

      if (tr.docChanged) {
        changeFn(tr);
        console.log("doc changed");
        setHash("");
      }
    }

    return new EditorView({
      parent: editorElement,
      dispatch: dispatchTransaction,
    });
  }

  let basic = true;
  let useTab = true;
  let tabSize = 4;
  let lineWrapping = true;
  let placeholder = "";
  let editable = true;

  let flashMsg = "";

  function getBaseExtensions2(
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

    if (basic) res.push(basicSetup2);
    if (useTab) res.push(keymap.of([indentWithTab]));
    if (placeholder) res.push(placeholderExt(placeholder));
    if (lineWrapping) res.push(EditorView.lineWrapping);

    return res;
  }
  /**
   * @param {string} s
   * @param {string} fileName
   * @returns {Promise<EditorState>}
   */
  async function createEditorState(s, fileName = "main.md") {
    /** @type {Extension[]}*/
    const exts = [
      ...getBaseExtensions2(
        basic,
        useTab,
        tabSize,
        lineWrapping,
        placeholder,
        editable
      ),
    ];
    const lang = await getCMLangFromFileName(fileName);
    if (lang) {
      exts.push(lang);
    }
    return EditorState.create({
      doc: s ?? undefined,
      extensions: exts,
    });
  }

  /**
   * @param {string} s
   */
  async function setEditorText(s) {
    const state = await createEditorState(s);
    editorView.setState(state);
  }

  function setProcessingMessage(s) {
    statusMsg = s;
    clearErrorMessage();
  }

  function clearProcessingMessage() {
    setProcessingMessage("");
  }

  function setErrorMessage(s) {
    errorMsg = s;
  }
  function clearErrorMessage() {
    setErrorMessage("");
  }

  /**
   * @param {string} hash
   */
  function setHash(hash) {
    console.log("setHash:", hash);
    if (hash != "") {
      hash = "#" + hash;
    }
    if (hash === location.hash) {
      return;
    }
    const uri = location.pathname + hash;
    if (history.pushState) {
      history.pushState(null, null, uri);
    } else {
      location.href = uri;
    }
  }

  function getError(res) {
    // TODO: don't get why there are Error and Errors
    // maybe can improve backend code?
    if (res.Error && res.Error !== "") {
      return res.Error;
    }
    if (res.Errors && res.Errors !== "") {
      return res.Errors;
    }
    return "";
  }

  /**
   * @param {KeyboardEvent} ev
   */
  function onKeyDown(ev) {
    if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") {
    } else if ((ev.ctrlKey || ev.metaKey) && ev.key === "s") {
    } else if (ev.key === "Escape") {
      clearOutput();
    } else {
      return;
    }

    ev.preventDefault();
    ev.stopPropagation();
  }

  /**
   * @param {KeyboardEvent} ev
   */
  function onTitleKeyDown(ev) {
    if (ev.key === "Enter") {
      ev.stopPropagation();
      ev.preventDefault();
      focusEditorView(editorView);
      return;
    }
  }

  function newNote() {}
  onMount(async () => {
    editorView = createEditorView();
    document.addEventListener("keydown", onKeyDown);

    clearProcessingMessage();
    setEditorText("");

    return () => {
      editorView = null;
      document.removeEventListener("keydown", onKeyDown);
    };
  });
</script>

<div class="g grid h-screen px-4 py-2">
  <div class=" ml-1 flex justify-between">
    <div
      on:keydown={onTitleKeyDown}
      contenteditable="true"
      class="user-modify-plain grow text-xl font-semibold focus-within:outline-white"
    >
      Title
    </div>
    <button
      on:click={newNote}
      class="text-sm border ml-4 border-gray-500 hover:bg-gray-100 rounded-md px-2"
      >new note</button
    >
  </div>
  <div class="overflow-auto">
    <div class="codemirror-wrapper flex-grow" bind:this={editorElement} />
  </div>
</div>

{#if statusMsg != ""}
  <div class="status fixed bg-yellow-100 min-w-[12em] border px-2 py-1 text-sm">
    {statusMsg}
  </div>
{/if}

{#if errorMsg !== ""}
  <div
    class="status fixed min-w-[12em] border px-2 py-1 text-sm bg-white text-red-500 whitespace-pre"
  >
    {errorMsg}
  </div>
{/if}

{#if outputMsg !== ""}
  <div
    class="output flex flex-col fixed text-xs shadow-md border border-gray-400 rounded-lg bg-white px-1"
  >
    <div class="flex bg-gray-50 border-b mb-1 pb-1 pt-1">
      <div class="font-bold">Output</div>
      <div class="grow" />
      <button
        on:click={clearOutput}
        class="hover:bg-gray-400 text-xs hover:text-white text-gray-600 mr-1"
        >close</button
      >
    </div>
    <div class="overflow-auto">
      <pre><code>{outputMsg}</code></pre>
    </div>
  </div>
{/if}

{#if flashMsg !== ""}
  <div class="fixed flash-msg bg-yellow-100 border px-2 py-1 text-sm">
    {flashMsg}
  </div>
{/if}

<style>
  .g {
    grid-template-rows: auto 1fr;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system,
      BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans,
      sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol,
      Noto Color Emoji;
  }

  .output {
    max-height: 80vh;
    min-height: 12em;
    width: 50%;
    right: 1em;
    bottom: 1em;
    /* border-color: blue; */
    /* border-width: 1px; */
  }

  .flash-msg {
    top: 52px;
    right: 8px;
  }

  .status {
    left: 4px;
    bottom: 4px;
  }
  @media screen and (max-width: 900px) {
    .hide-if-small {
      display: none;
    }
  }

  /* have to undo some of the taildwindcss reset */
  :global(.codemirror-wrapper) {
    height: 100%;
    /* background-color: transparent; */
  }
  :global(.cm-editor) {
    overflow: hidden;
    height: 100%;
  }

  .codemirror-wrapper :global(.cm-focused) {
    outline: none;
  }
  button cmd {
    opacity: 0.4;
    font-size: 90%;
  }

  .user-modify-plain {
    -webkit-user-modify: read-write-plaintext-only;
  }
</style>
