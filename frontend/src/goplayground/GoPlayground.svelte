<script>
  /** @typedef { import("@codemirror/state").Extension} Extension */

  import TopNav from "../TopNav.svelte";
  import { EditorView, lineNumbers } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import { debounce, setClipboard, throwIf } from "../util";
  import { getBaseExtensions } from "../cmexts";
  import { getCMLangFromFileName } from "../cmlangs";
  import { onMount } from "svelte";
  import browser from "../browser";
  import { logEventRaw } from "../events";

  const sampleGo = `// You can edit this code!
// Click here and start typing.
package main

import "fmt"

func main() {
	fmt.Println("Hello, 世界")
}
`;

  /** @type {HTMLElement} */
  let editorElement = null;
  /** @type {EditorView} */
  let editorView = null;
  let outputMsg = "";
  let statusMsg = "";
  let errorMsg = "";

  let runShortcut = browser.mac ? "⌘+↵" : "Ctrl+↵";
  let formatShortcut = browser.mac ? "⌘+S" : "Ctrl+S";

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

  /**
   * @param {string} s
   * @param {string} fileName
   * @returns {Promise<EditorState>}
   */
  async function createEditorState(s, fileName = "main.go") {
    /** @type {Extension[]}*/
    const exts = [
      ...getBaseExtensions(
        basic,
        useTab,
        tabSize,
        lineWrapping,
        placeholder,
        editable
      ),
      lineNumbers(),
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

  async function share() {
    logGoPlaygroundEvent("share");
    const s = editorView.state.doc.toString();
    setProcessingMessage("Creating sharable link...");
    const rsp = await fetch("/api/goplay/share", {
      method: "POST",
      body: s,
    });
    const res = await rsp.text();
    setHash(res);
    setClipboard(window.location.toString());
    clearProcessingMessage();
    showFlashMessage("Copied share link to clipboard");
  }

  function showFlashMessage(s) {
    flashMsg = s;
    setTimeout(() => {
      flashMsg = "";
    }, 3000);
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

  function removeHash() {
    var scrollV,
      scrollH,
      loc = window.location;
    if ("pushState" in history)
      history.pushState("", document.title, loc.pathname + loc.search);
    else {
      // Prevent scrolling by storing the page's current scroll offset
      scrollV = document.body.scrollTop;
      scrollH = document.body.scrollLeft;

      loc.hash = "";

      // Restore the scroll offset, should be flicker free
      document.body.scrollTop = scrollV;
      document.body.scrollLeft = scrollH;
    }
  }

  /**
   * @param {string} hash
   */
  async function tryLoadHash(hash) {
    setProcessingMessage("Loading code...");
    const uri = "/api/goplay/load?" + hash.substring(1);
    const rsp = await fetch(uri);
    let s = sampleGo;
    if (rsp.ok) {
      s = await rsp.text();
    } else {
      removeHash();
    }
    setEditorText(s);
    clearProcessingMessage();
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

  function logGoPlaygroundEvent(name, o = {}) {
    logEventRaw({
      app: "goplayground",
      name: name,
      ...o,
    });
  }

  async function run() {
    logGoPlaygroundEvent("run");
    const code = editorView.state.doc.toString();
    setProcessingMessage("Executing code...");
    clearOutput();
    const rsp = await fetch("/api/goplay/compile", {
      method: "POST",
      body: code,
    });
    clearProcessingMessage();
    const res = await rsp.json();
    console.log("res:", res);
    const err = getError(res);
    if (err != "") {
      console.log("error:", err);
      setErrorMessage("Error:" + err);
      return;
    }
    let s = "";
    for (const ev of res.Events) {
      if (s !== "") {
        s += "\n";
      }
      if (ev.Kind === "stderr") {
        s += "Stderr:\n";
      }
      s += ev.Message;
    }
    outputMsg = s;
  }

  async function format() {
    logGoPlaygroundEvent("format");
    const s = editorView.state.doc.toString();
    setProcessingMessage("Formatting code...");
    // const uri = "play.golang.org/fmt";
    const uri = "/api/goplay/fmt";
    const rsp = await fetch(uri, {
      method: "POST",
      body: s,
    });
    clearProcessingMessage();
    if (!rsp.ok) {
      setErrorMessage("Error:" + (await rsp.text()));
      return;
    }
    const res = await rsp.json();
    if (res.Error) {
      setErrorMessage("Error:" + res.Error);
      return;
    }
    // TODO: preserve cursor position
    if (res.Body === editorView.state.doc.toString()) {
      return;
    }
    setEditorText(res.Body);
  }

  /**
   * @param {KeyboardEvent} ev
   */
  function onKeyDown(ev) {
    if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") {
      run();
    } else if ((ev.ctrlKey || ev.metaKey) && ev.key === "s") {
      format();
    } else if (ev.key === "Escape") {
      clearOutput();
    } else {
      return;
    }

    ev.preventDefault();
    ev.stopPropagation();
  }

  onMount(() => {
    logGoPlaygroundEvent("appOpen");

    editorView = createEditorView();
    document.addEventListener("keydown", onKeyDown);

    clearProcessingMessage();
    const hash = location.hash;
    if (hash.startsWith("#")) {
      tryLoadHash(hash);
    } else {
      setEditorText(sampleGo);
    }

    return () => {
      editorView = null;
      document.removeEventListener("keydown", onKeyDown);
    };
  });
</script>

<div class="g grid h-screen">
  <TopNav>
    <div class="flex items-baseline">
      <div class="text-purple-800 font-bold"><tt>Go Playground</tt></div>
      <div class="text-gray-700 text-sm ml-2 hide-if-small">
        execute Go snippets online
      </div>
    </div>
    <button
      on:click={run}
      class="shadow-md text-sm text-gray-700 ml-4 px-2 border hover:bg-gray-200"
      >Run <cmd>{runShortcut}</cmd></button
    >
    <button
      on:click={format}
      class="shadow-md text-sm text-gray-700 ml-4 px-2 border hover:bg-gray-200"
      >Format <cmd>{formatShortcut}</cmd></button
    >
    <button
      on:click={share}
      class="shadow-md text-sm text-gray-700 ml-4 px-2 border hover:bg-gray-200"
      >Share</button
    >
  </TopNav>
  <div class="text-sm overflow-auto">
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
    background-color: #f3f5f6;
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
</style>
