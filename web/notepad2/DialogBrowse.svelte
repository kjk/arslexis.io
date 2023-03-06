<script context="module">
  /** @typedef {import("../fileutil").FsEntry} FsEntry */
  /**
   * @typedef { Object } Entry
   * @property {string} name
   * @property {Entry} parent
   * @property {Function} open
   * @property {FsFile} [file]
   * @property {FsEntry} [entry]
   * @property {FileSystemDirectoryHandle} [dirHandle]
   */
</script>

<script>
  import { onMount } from "svelte";
  import WinDialogBaseNoOverlay from "../WinDialogBaseNoOverlay.svelte";
  import { progress } from "../Progress.svelte";
  import { focus } from "../actions/focus";
  import { FsFile, fsTypeIndexedDB, fsTypeFolder, getFileList } from "./FsFile";
  import { openDirPicker, readDir, supportsFileSystem } from "../fileutil";
  import { sortEntries } from "../wc/Folder.svelte";

  export let open = false;
  /** @type {Function} */
  export let onDone;

  /** @type {Entry}*/
  let selected = null;

  /** @type {FileSystemDirectoryHandle[]}*/
  let dirHandles = [];

  let btnOpenDisabled = false;
  let btnOpenFolderDisabled = false;

  /** @type {Entry[]} */
  let entries = [];

  /**
   * @param {Entry} e
   */
  async function entryClicked(e) {
    console.log("entryClicked:", e);
    selected = e;
  }

  /**
   * @param {Entry} e
   */
  async function entryDblClicked(e) {
    console.log("entryDblClicked:", e);
    await e.open(e);
  }

  async function btnOpenClicked() {
    let e = selected;
    console.log("btnOpenClicked:", e);
    if (!e) {
      return;
    }
    await e.open(e);
  }

  async function btnOpenFolderClicked() {
    let dirHandle = await openDirPicker();
    console.log("btnOpenFolderClicked: dirHandle:", dirHandle);
    if (dirHandle == null) {
      console.log("");
      return;
    }
    dirHandles.push(dirHandle);
    await setTopLevel(null);
  }

  function close() {
    open = false;
    onDone(null);
  }

  $: btnOpenDisabled = selected == null || !selected.file;

  /**
   * @param {FileSystemDirectoryHandle} dh
   * @param {Entry} parent
   */
  async function setDirHandle(dh, parent) {
    console.log("setDirHandle:", dh, "parent:", parent);
    // TODO: cache things
    $progress = `reading ${dh.name}`;
    const fsEntry = await readDir(dh);
    $progress = "";
    /** @type {Function} */
    let open = setTopLevel;
    if (parent != null) {
      open = openDirHandle;
    }
    /** @type {Entry} */
    let e = {
      name: "..",
      parent: parent,
      open: open,
    };
    let a = [e];
    let fsEntries = fsEntry.dirEntries;
    sortEntries(fsEntries);
    for (const fse of fsEntries) {
      if (fse.isDir) {
        e = {
          name: fse.name + "/",
          parent: parent,
          open: openDirHandle,
          dirHandle: fse.handle,
        };
      } else {
        const fsf = new FsFile(fsTypeFolder, fse.name, fse.name);
        fsf.fileHandle = fse.handle;
        e = {
          name: fse.name,
          parent: parent,
          open: openFile,
          file: fsf,
        };
      }
      a.push(e);
    }
    entries = a;
  }

  /**
   * @param {Entry} e
   */
  async function openDirHandle(e) {
    console.log("openDirHandle:", e);
    await setDirHandle(e.dirHandle, e.parent);
  }

  /**
   * @param {Entry} e
   */
  async function setTopLevel(e) {
    console.log();
    /** @type {Entry} */
    const e1 = {
      name: "browser",
      parent: null,
      open: openBrowser,
    };
    let a = [e1];
    for (const dh of dirHandles) {
      /** @type {Entry} */
      const e = {
        name: dh.name,
        parent: null,
        dirHandle: dh,
        open: openDirHandle,
      };
      a.push(e);
    }
    entries = a;
  }

  /**
   * @param {Entry} e
   */
  async function openFile(e) {
    onDone(e.file);
  }

  /**
   * @param {Entry} e
   */
  async function openBrowser(e) {
    /** @type {Entry} */
    let e1 = {
      name: "..",
      parent: e,
      open: setTopLevel,
    };
    let a = [e1];
    const files = await getFileList(fsTypeIndexedDB);
    for (const f of files) {
      /** @type {Entry} */
      const e2 = {
        name: f.name,
        parent: e,
        file: f,
        open: openFile,
      };
      a.push(e2);
    }
    entries = a;
  }

  onMount(async () => {
    await setTopLevel(null);
  });
</script>

<WinDialogBaseNoOverlay bind:open title="Browse Files">
  <div
    class="flex mx-4 px-2 py-2 flex-col overflow-auto border-2 my-2 min-h-[12rem] max-h-[60vh] cursor-pointer select-none text-xs"
    tabindex="0"
    slot="main"
    role="listbox"
  >
    {#each entries as f}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      {#if f === selected}
        <div
          class="bg-gray-100 hover:bg-gray-200"
          on:dblclick={() => entryDblClicked(f)}
          on:click={() => entryClicked(f)}
        >
          {f.name}
        </div>
      {:else}
        <div
          class="hover:bg-gray-200"
          on:dblclick={() => entryDblClicked(f)}
          on:click={() => entryClicked(f)}
        >
          {f.name}
        </div>
      {/if}
    {/each}
  </div>

  <!-- bottom -->
  <div slot="bottom" class="flex mx-2 justify-between text-select-none text-xs">
    {#if supportsFileSystem()}
      <button
        disabled={btnOpenFolderDisabled}
        class="btn-dlg px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500 disabled:text-gray-200 disabled:border-0 disabled:bg-white"
        on:click={btnOpenFolderClicked}>Open Folder</button
      >
    {/if}

    <div class="grow" />

    <button
      disabled={btnOpenDisabled}
      class="btn-dlg px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500 disabled:text-gray-200 disabled:border-0 disabled:bg-white"
      on:click={btnOpenClicked}>Open</button
    >
    <button
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      use:focus
      on:click={close}>Cancel</button
    >
  </div>
</WinDialogBaseNoOverlay>
