<script context="module">
  /** @typedef { import("@codemirror/state").Extension} Extension */

  /**
   * @typedef {Object} GistFile
   * @property {number} [fid]
   * @property {string} [initialName]
   * @property {string} filename
   * @property {string} content
   * @property {EditorState} [initialState]
   * @property {EditorState} [state]
   * @property {boolean} [isNew]
   * @property {boolean} [isTemporary]
   */

  /**
   * @typedef {Object} GistOwner
   * @property {string} login
   */

  /**
   * @typedef {Object} Gist
   * @property {string} [id]
   * @property {GistOwner} [owner]
   * @property {Object.<string, GistFile>} files
   * @property {boolean} [public]
   * @property {boolean} isLocalGist
   * @property {string} description
   */
</script>

<script>
  import { onMount } from "svelte";
  import { EditorView, lineNumbers } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import { marked } from "marked";
  import { showMessage } from "../Messages.svelte";
  import Overlay from "../Overlay.svelte";
  import SvgAdd from "../svg/SvgAdd.svelte";
  import SvgDots from "../svg/SvgDots.svelte";
  import HelpButton from "./HelpButton.svelte";
  import Login from "./Login.svelte";
  import GistDescription from "./GistDescription.svelte";
  import SelectLangDialog from "./SelectLangDialog.svelte";
  import { positionnode } from "../actions/positionnode.js";
  import { tooltip } from "../actions/tooltip.js";
  import * as githubapi from "../githubapi.js";
  import { docsForFile } from "./langs.js";
  import {
    storeLocalGist,
    deleteLocalGist,
    refreshGistsForLoggedUser,
  } from "./store.js";
  import { ghtoken, getLoggedUser } from "../github_login.js";
  import { logEvent } from "../events.js";
  import { goToGistById, goGistEditorHome } from "./router.js";
  import Messages from "../Messages.svelte";

  import { getBaseExtensions, getTheme } from "../cmexts";
  import { getCMLangFromFileName } from "../cmlangs";
  import { focusEditorView } from "../cmutil";
  import {
    len,
    fileExt,
    debounce,
    throwIf,
    removeDescriptionAd,
  } from "../util";

  import { genNextUniqueFileName } from "../fileutil";

  export let basic = true;
  export let theme = undefined;
  export let useTab = true;
  export let tabSize = 2;
  export let styles = undefined;
  export let lineWrapping = false;
  export let editable = true;
  export let placeholder = undefined;

  /** @type {Gist} */
  export let gist = {
    files: {},
    public: false,
    isLocalGist: false,
    description: "",
  };

  let isLoggedIn = !!$ghtoken;
  let description = gist.description;

  /** @type {HTMLElement} */
  let editorElement = null;
  /** @type {EditorView} */
  let editorView = null;

  /** @type {GistFile[]} */
  let files = [];
  /** @type {GistFile} */
  let selectedFile = null;
  let isFormattable = false;
  let isGistChanged = false;
  /** @type {GistFile[]} */
  let deletedFiles = [];
  let savePending = false;
  // let cursorPosDuringSave = null;
  let showSelectLang = false;
  let showingMenu = false;
  let doublePane = false;

  // file tab being edited
  /** @type {GistFile} */
  let editing = null;
  let editingOrignalName = "";
  /** @type {HTMLElement} */
  let menuElement = null;

  /** @type {string[][]}*/
  let fileSpecificMenus = [];
  let isDeletable = false;
  let resultStdOut = "";
  let resultStdErr = "";

  let secondPaneHTML = "";
  let isMarkdown = false;

  // used to generate unique file.fid
  let currFileID = 0;

  let dotsStyle = `width: 15px;
  height: 13px;
`;

  if (gist.isLocalGist) {
    isDeletable = true;
  }

  $: {
    isLoggedIn = !!$ghtoken;
    // console.log("ghtoken:", $ghtoken, "isLoggedIn:", isLoggedIn);
  }

  $: fileSpecificMenus = buildFileSpecificMenus(selectedFile);
  $: isDeletable = calcIsDeletable(gist, isLoggedIn);

  /**
   * @param {string} s
   * @returns {string}
   */
  export function addDescriptionAd(s) {
    return s || ""; // no longer adding
  }

  /**
   *
   * @param {Gist} gist
   * @param {boolean} loggedIn
   * @returns {boolean}
   */
  function calcIsDeletable(gist, loggedIn) {
    if (gist.isLocalGist) {
      return true;
    }
    if (!loggedIn) {
      return false;
    }
    return gist.owner.login === getLoggedUser();
  }

  // function isTextFile(name) {
  //   return name.endsWith(".txt");
  // }

  // export function textFormat(s) {
  //   s = s.replace(/\n/g, " ");
  //   s = s.replace(/\r/g, " ");
  //   while (s.indexOf("  ") !== -1) {
  //     s = s.replace(/  /g, " ");
  //   }
  //   return s;
  // }

  // window.formatCurrentFile = function() {
  //   console.log("formatCurrentFile");
  //   const doc = editor.getDoc();
  //   const s = doc.getValue();
  //   const newS = textFormat(s);
  //   doc.setValue(newS);
  //   hideMenu();
  //   return false;
  // }

  /**
   * @param {GistFile} f
   * @returns {string[][]}
   */
  function buildFileSpecificMenus(f) {
    if (!f) {
      return [];
    }
    const fileName = f.filename;
    const res = docsForFile(fileName) || [];
    // TODO; this is temporary
    // if (isTextFile(fileName)) {
    //   const mi = [
    //     'Format file',
    //     'javascript:formatCurrentFile()'
    //   ];
    //   res.push(mi);
    // }
    return res;
  }

  function showMenu() {
    // console.log("showMenu");
    showingMenu = true;
  }

  function selectLangDismissed() {
    showSelectLang = false;
  }

  /**
   * @param {KeyboardEvent} e
   */
  function isSaveKey(e) {
    if (e.key !== "s") {
      return false;
    }
    if (e.metaKey) {
      return true;
    }
    if (e.ctrlKey) {
      return true;
    }
    return false;
  }

  function maybeSaveGist() {
    if (savePending || !isGistChanged) {
      return;
    }
    if (gist.isLocalGist) {
      saveLocalGist();
    } else {
      saveGist();
    }
  }

  function onKeyDown(e) {
    if (!isSaveKey(e)) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    maybeSaveGist();
  }

  function createEditorView() {
    throwIf(!editorElement);

    function handleEditorChange(tr) {
      if (isMarkdown) {
        const s = tr.state.doc.toString();
        secondPaneHTML = marked.parse(s);
      }

      selectedFile.state = tr.state;
      calcIsGistChanged();

      // must re-render tabs to show change indicator
      files = files;
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
   * @param {string} s
   * @param {string} fileName
   * @returns {Promise<EditorState>}
   */
  async function createEditorState(s, fileName = "") {
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
      ...getTheme(theme, styles),
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

  onMount(() => {
    editorView = createEditorView();
    document.addEventListener("keydown", onKeyDown);

    /** @type {GistFile[] }*/
    let tmp = [];
    for (let k in gist.files) {
      currFileID++;
      /** @type {GistFile}*/
      const f = gist.files[k];
      f.fid = currFileID;
      f.initialName = f.filename;
      f.initialState = f.state;
      f.isTemporary = false;
      f.isNew = false;
      tmp.push(f);
    }

    files = tmp; // trigger re-render
    selectTab(files[0]);

    return () => {
      editorView = null;
      document.removeEventListener("keydown", onKeyDown);
    };
  });

  function calcIsGistChanged() {
    if (len(deletedFiles) > 0) {
      isGistChanged = true;
      return;
    }
    const d1 = removeDescriptionAd(description);
    const d2 = removeDescriptionAd(gist.description);
    if (d1 !== d2) {
      isGistChanged = true;
      return;
    }
    for (let f of files) {
      if (isFileChanged(f)) {
        isGistChanged = true;
        return;
      }
    }
    isGistChanged = false;
  }

  /**
   * @param {GistFile} file
   */
  async function selectTab(file) {
    // TODO: when file is renamed, we need to change lang
    // in extentions. Not sure where to put that
    if (!file.initialState) {
      file.initialState = await createEditorState(file.content, file.filename);
      file.state = file.initialState;
    }
    editorView.setState(file.state);
    selectedFile = file;

    // this might be called after renaming a file in current tab
    // so re-calculate things that might depend
    //isFormattable = isFileFormattable(selectedFile.filename);
    // TODO: for now we don't have formatting
    //isFormattable = false;

    const fext = fileExt(file.filename);
    switch (fext) {
      case ".md":
        doublePane = true;
        isMarkdown = true;
        const s = file.state.doc.toString();
        secondPaneHTML = marked.parse(s);
        break;
      default:
        doublePane = false;
        isMarkdown = false;
        break;
    }

    focusEditorView(editorView);
  }

  /**
   * @param {GistFile} file
   */
  function onTabClick(file) {
    // clicking on selected tab switches to file name editing mode
    // otherwise selects a tab
    if (file === selectedFile) {
      // temporary files are not editable
      if (file.isTemporary) {
        return;
      }
      editing = file;
      editingOrignalName = file.filename;
      return;
    }
    selectTab(file);
  }

  /**
   * @param {GistFile} f
   */
  function maybeRememberDeleted(f) {
    if (f.isNew) {
      return;
    }
    if (isOutputFile(f)) {
      return;
    }
    deletedFiles.push(f);
  }

  function removeFileAtIdx(idx) {
    const removed = files[idx];
    files.splice(idx, 1);
    let toSelect = null;
    const n = files.length;
    if (n > 0) {
      if (idx > 0 && idx >= n) {
        idx -= 1;
      }
      toSelect = files[idx];
    }
    maybeRememberDeleted(removed);
    calcIsGistChanged();
    selectTab(toSelect);
  }

  // name, content, isTemporary are all optional
  function addFile(
    initialName = "main.txt",
    content = "",
    isTemporary = false
  ) {
    const name = makeNameUnique(initialName, null);
    currFileID++;
    /** @type {GistFile} */
    const f = {
      // gist info
      filename: name,
      initialName: name,
      initialState: null,
      content: content,
      state: null,
      // only for temporary use
      fid: currFileID,
      isTemporary: isTemporary,
      isNew: true,
    };
    files.push(f);
    calcIsGistChanged();
    selectTab(f);
    return f;
  }

  function isFileChanged(file) {
    // temporary files are for output
    if (isOutputFile(file)) {
      return false;
    }
    if (file.isNew) {
      return true;
    }
    // can be called before we created state (it's created on demand)
    const same = file.state ? file.state.doc.eq(file.initialState.doc) : true;
    if (!same) {
      return true;
    }
    if (isFileRenamed(file)) {
      return true;
    }
    return false;
  }

  function selectInput(event) {
    setTimeout(() => {
      const el = event.target;
      const s = selectedFile.filename;
      const idx = s.lastIndexOf(".");
      let end = s.length;
      if (idx !== -1) {
        end = idx;
      }
      el.setSelectionRange(0, idx);
    });
  }

  function isFileRenamed(file) {
    return file.filename != file.initialName;
  }

  async function finishFileRenaming() {
    if (editing.filename !== editingOrignalName) {
      editing.filename = makeNameUnique(editing.filename, editing);
    }
    // TDOO: need to update state extensions for lang
    // setEditorOptionsFromFile(editing);
    editing = null;
    // rebuild gist files
    /** @type {Object.<string, GistFile>}*/
    const newFiles = {};
    for (const f of files) {
      newFiles[f.filename] = f;
    }
    gist.files = newFiles;
    await selectTab(selectedFile);
    calcIsGistChanged();
    // focus the editor, but wait a beat (so key events aren't misdirected)
    focusEditorView(editorView);
  }

  /**
   * @param {string} s
   * @param {GistFile} file
   */
  function makeNameUnique(s, file) {
    for (let f of files) {
      if (f === file) {
        continue;
      }
      if (f.filename === s) {
        // apply recursively until we find unique name
        // debugger;
        const newName = genNextUniqueFileName(s);
        return makeNameUnique(newName, file);
      }
    }
    return s;
  }

  /**
   * @param {KeyboardEvent} e
   */
  function tabEditKeyDown(e) {
    if (e.key === "Enter") {
      const el = e.target;
      /** @type {HTMLElement} */ (el).blur();
      return;
    }

    if (e.key === "Escape") {
      // abandon editing
      editing.filename = editingOrignalName;
      const el = e.target;
      /** @type {HTMLElement} */ (el).blur();
      return;
    }
  }

  /**
   * @param {GistFile} f
   * @returns {boolean}
   */
  function isOutputFile(f) {
    // all temporary files are output files (for now?)
    return f.isTemporary;
  }

  function format() {
    console.log("format");
  }

  function updateAfterSave(newGist) {
    gist = newGist;
    description = gist.description;
    deletedFiles = [];
    gist.files = {};
    for (let f of files) {
      f.isNew = false;
      const fname = f.filename;
      gist.files[fname] = f;
      if (f.isTemporary) {
        continue;
      }
      f.initialName = f.filename;
      f.initialState = f.state;
    }
    //selectedFile.doc.setCursor(cursorPosDuringSave);
    // cursorPosDuringSave = null;
    calcIsGistChanged();
    files = files; // trigger re-display
  }

  async function saveLocalGist() {
    // console.log("saveLocalGist");
    //cursorPosDuringSave = selectedFile.doc.getCursor();

    /** @type {Object.<string, GistFile>}*/
    const gistFiles = {};
    for (let f of files) {
      if (isOutputFile(f)) {
        continue;
      }
      // create a copy with only the data we want to save
      const content = f.state.doc.toString();
      const newFile = {
        filename: f.filename,
        content: content,
      };
      gistFiles[newFile.filename] = newFile;
    }
    /** @type {Gist} */
    const g = {
      id: gist.id,
      description: description,
      isLocalGist: true,
      files: gistFiles,
    };

    await storeLocalGist(g);
    updateAfterSave(g);
  }

  async function saveLocalToGithub() {
    const newFiles = {};
    for (let f of files) {
      if (isOutputFile(f)) {
        continue;
      }
      const content = f.state.doc.toString();
      newFiles[f.filename] = {
        content: content,
      };
    }
    const newCreateGist = {
      description: addDescriptionAd(description),
      files: newFiles,
      public: true,
    };
    savePending = true;
    const res = await githubapi.createGist(newCreateGist);
    savePending = false;
    if (!res) {
      return;
    }
    await deleteLocalGist(gist.id);
    refreshGistsForLoggedUser(true);
    // we must refresh by going to the url
    goToGistById(res.id);
  }

  async function saveGist() {
    //cursorPosDuringSave = selectedFile.doc.getCursor();

    // save on gist.github.com
    /** @type {Object.<string, Object>}*/
    const gfiles = {};
    const gistUpdate = {
      description: addDescriptionAd(description),
      files: gfiles,
    };

    //developer.github.com/v3/gists/#edit-a-gist
    for (let f of deletedFiles) {
      gfiles[f.filename] = null;
    }

    for (let f of files) {
      // we don't save files that are an output of running the file
      if (isOutputFile(f)) {
        continue;
      }
      // if a tab was opened, the content is in f.state, otherwise
      // it's f.content
      let content = f.content;
      if (f.state) {
        content = f.state.doc.toString();
      }
      if (isFileRenamed(f)) {
        gfiles[f.initialName] = {
          content: content,
          filename: f.filename,
        };
        continue;
      }
      if (!isFileChanged(f)) {
        continue;
      }
      gfiles[f.filename] = {
        content: content,
      };
    }
    // console.log("saveGist:", gistUpdate);
    savePending = true;
    const newGist = await githubapi.updateGist(gist.id, gistUpdate);
    savePending = false;
    // console.log("newGist:", newGist);
    if (!newGist) {
      return;
    }
    showMessage("Saved a gist");
    updateAfterSave(newGist);
  }

  function descriptionChanged(d) {
    description = d;
    calcIsGistChanged();
  }

  async function deleteLocal() {
    // not logged directly in deleteLocalGist because
    // deleteLocalGist is also called when saving local to github
    logEvent("deleteLocalGist");
    await deleteLocalGist(gist.id);
    location.href = "./";
  }

  async function deleteGist() {
    if (gist.isLocalGist) {
      deleteLocal();
      return;
    }
    const ok = await githubapi.deleteGist(gist.id);
    if (!ok) {
      console.log("deleteGist() failed");
      return;
    }
    refreshGistsForLoggedUser(true);
    location.href = "./";
  }

  async function goHome() {
    if (gist.isLocalGist) {
      await saveLocalGist();
    }
    goGistEditorHome();
  }

  function getSaveTooltip() {
    // TODO: different key combination on Windows
    return "Save locally (this browser) ⌘-S";
  }

  function onNewGist() {
    // console.log("onNewGist");
    showSelectLang = true;
  }

  function clearOutput() {
    resultStdErr = "";
    resultStdOut = "";
  }
</script>

{#if resultStdErr || resultStdOut}
  <div
    class="output-wrap absolute z-40 overflow-auto bg-white shadow bottom-16 right-8"
  >
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="close-btn top-2 px-2 py-1 right-2 cursor-pointer z-40 absolute
      text-xs hover:bg-yellow-200"
      on:click={clearOutput}
    >
      close
    </div>

    {#if resultStdErr}
      <div class="flex flex-col p-2">
        <div class="text-sm py-1 border-b border-gray-500">stderr</div>
        <div class="std-error">{resultStdErr}</div>
      </div>
    {/if}
    {#if resultStdOut}
      <div class="flex flex-col p-2">
        <div class="text-sm py-1 border-b border-gray-500">stdout</div>
        <div class="std-output">{resultStdOut}</div>
      </div>
    {/if}
  </div>
{/if}

<div
  class="grid fixed top-0 left-0 w-screen h-screen max-h-screen"
  style="grid-template-rows: auto auto 1fr;"
>
  <div class="flex items-center text-sm px-4 mb-1">
    <div>
      <a href="/" class="hover:bg-gray-100" on:click|preventDefault={goHome}>
        Home
      </a>
    </div>
    <div class="px-2 text-gray-400">/</div>
    <GistDescription {gist} {descriptionChanged} />
    <Login showTwitter={false} onGoHome={goHome} {onNewGist} gistid={gist.id} />
  </div>

  <div class="flex items-center text-sm py-0 px-4">
    {#each files as file, idx (file.fid)}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        role="button"
        class="tab select-none"
        on:click={() => onTabClick(file)}
        on:dblclick={(e) => e.stopPropagation()}
        class:active={file === selectedFile}
      >
        {#if file === editing}
          <!-- svelte-ignore a11y-autofocus -->
          <input
            class="w-full border-none outline-none bg-transparent"
            autofocus
            spellcheck={false}
            bind:value={editing.filename}
            on:focus={selectInput}
            on:blur={finishFileRenaming}
            on:keydown={tabEditKeyDown}
          />
        {:else}
          <span>{file.filename}</span>
          <span
            class="text-blue-500 ml-2 hidden"
            class:show={isFileChanged(file)}
          >
            &bull;
          </span>
          {#if files.length > 1}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <span
              class="close"
              on:click|stopPropagation={(e) => removeFileAtIdx(idx)}
            >
              <SvgAdd style={"display: inline-block; height: 8px"} />
            </span>
          {/if}
        {/if}
      </div>
    {/each}

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="tab tab-plus select-none font-bold"
      style="color: gray;"
      on:click={() => addFile("main.txt", "")}
      use:tooltip={"Add a file"}
    >
      +
    </div>

    {#if gist.isLocalGist}
      <div class="tab-action">
        <a
          href="/dummy"
          class:inactive={!isGistChanged || savePending}
          use:tooltip={getSaveTooltip()}
          on:click|preventDefault={saveLocalGist}
        >
          save
        </a>
      </div>

      {#if isLoggedIn}
        <div class="tab-action" use:tooltip={"Save to gist.github.com"}>
          <a href="/dummy" on:click|preventDefault={saveLocalToGithub}>
            save as gist
          </a>
        </div>
      {/if}
    {:else}
      <div class="tab-action" use:tooltip={"Save to gist.github.com"}>
        <a
          href="/dummy"
          class:inactive={!isGistChanged || savePending}
          on:click|preventDefault={saveGist}
        >
          save gist
        </a>
      </div>
    {/if}

    {#if isFormattable}
      <div class="tab-action" use:tooltip={"Format file"}>
        <a href="/dummy" on:click|preventDefault={format}>format</a>
      </div>
    {/if}

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="menu hover:bg-gray-100 px-2 py-1"
      bind:this={menuElement}
      on:click={showMenu}
    >
      <SvgDots style={dotsStyle} />
    </div>

    {#if showingMenu}
      <Overlay bind:open={showingMenu}>
        <!-- TOD: why need to use style and adding flex to class breaks things?-->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class="dropdown-content"
          on:click={() => {
            showingMenu = false;
          }}
          use:positionnode={{
            node: menuElement,
            position: "bottom",
            offsety: 4,
          }}
          style={"display: flex; font-size: 9.5pt"}
        >
          {#if !gist.isLocalGist}
            <div>
              <a
                href="https://gist.github.com/{gist.id}"
                target="_blank"
                rel="noreferrer"
              >
                See on gist.github.com
              </a>
            </div>
          {/if}
          {#each fileSpecificMenus as menuItem}
            <div>
              {#if menuItem[1].startsWith("javascript:")}
                <a href={menuItem[1]}>{menuItem[0]}</a>
              {:else}
                <a href={menuItem[1]} target="_blank" rel="noreferrer">
                  {menuItem[0]}
                </a>
              {/if}
            </div>
          {/each}
          <!-- <div>
            <a
              href="https://onlinetool.io/docs/gist-editor"
              target="_blank"
              rel="noreferrer"
            >
              CodeEval docs
            </a>
          </div> -->
          {#if isDeletable}
            <div>
              <a
                href="/dummy"
                style="color: red"
                on:click|preventDefault={deleteGist}
              >
                Delete
              </a>
            </div>
          {/if}
        </div>
      </Overlay>
    {/if}
  </div>

  <div class="flex overflow-hidden">
    <div
      class:halfwidth={doublePane}
      class="codemirror-wrapper overflow-auto flex-grow bg-transparent"
      bind:this={editorElement}
    />

    {#if doublePane}
      <div class="second-pane w-1/2 bg-gray-50 h-full">
        {@html secondPaneHTML}
      </div>
    {/if}
  </div>
</div>

{#if showSelectLang}
  <SelectLangDialog bind:open={showSelectLang} />
{/if}

<Messages />
<HelpButton />

<style>
  /* have to undo some of the taildwindcss reset */
  :global(.codemirror-wrapper) {
    height: 100%;
  }
  :global(.cm-editor) {
    overflow: hidden;
    height: 100%;
  }
  .second-pane {
    overflow: scroll;
  }
  :global(.second-pane h1) {
    font-weight: bold;
    font-size: 150%;
    line-height: 170%;
  }

  :global(.second-pane h2) {
    font-weight: bold;
    font-size: 130%;
    line-height: 150%;
  }

  :global(.second-pane h3) {
    font-weight: bold;
    font-size: 110%;
    line-height: 130%;
  }

  :global(.second-pane pre) {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    margin-left: 2px;
    margin-right: 2px;
    padding: 0.5rem;
    border: 1px solid lightgray;
    background-color: white;
  }

  .tab {
    padding: 6px 0.75em;
    background-color: white;
    white-space: nowrap;
  }

  .tab:hover {
    border-top: 1px solid lightgray;
    background-color: #f3f3f3;
    cursor: pointer;
  }

  .tab-action {
    display: flex;
    align-items: center;
  }

  .tab-action a {
    /* color: #273ae9; */
    color: gray;
    padding: 4px 0.5em;
  }

  .tab-action a:hover {
    background-color: #f3f3f3;
  }

  .tab-plus:hover {
    border-top: 1px solid #f3f3f3;
  }

  a.inactive {
    /* color: #8e97eb !important; */
    color: lightgray !important;
    cursor: default;
    cursor: not-allowed;
  }

  a.inactive:hover {
    /* color: #8e97eb !important; */
    /* cursor: default; */
    background-color: transparent !important;
  }

  .active {
    border-top: 1px solid lightgray;
  }

  .active:hover {
    cursor: default;
  }

  .close {
    padding-right: 4px;
    padding-left: 4px;
    cursor: pointer;
  }

  .close:hover {
    background: rgb(248, 100, 100);
    color: white;
  }

  .show {
    display: inline-block;
  }

  .halfwidth {
    width: 50%;
  }

  .output-wrap {
    min-width: 25vw;
    min-height: 25vw;
    max-width: 50vw;
    max-height: 50vh;
    background-color: lightyellow;
  }

  .std-output,
  .std-error {
    padding: 4px 0px 0px 0px;
    white-space: pre-wrap;
    font-family: monospace;
    font-size: 14px;
  }

  .codemirror-wrapper :global(.cm-focused) {
    outline: none;
  }
</style>
