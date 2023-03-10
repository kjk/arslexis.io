<script context="module">
  /** @typedef {import("../fileutil").FsEntry} FsEntry */
  /** @typedef {import("./np2store").FavEntry} FavEntry*/
  /**
   * @typedef { Object } Entry
   * @property {string} name
   * @property {Entry} parent
   * @property {Function} open
   * @property {Function} [remove] or delete
   * @property {string} [removeTitle]
   * @property {FsFile} [file]
   * @property {FsEntry} [entry]
   * @property {FavEntry} [fav]
   * @property {FileSystemDirectoryHandle} [dirHandle]
   */
</script>

<script>
  import { onMount } from "svelte";
  import WinDialogBaseNoOverlay from "../WinDialogBaseNoOverlay.svelte";
  import { progress } from "../Progress.svelte";
  import { focus } from "../actions/focus";
  import {
    FsFile,
    fsTypeIndexedDB,
    fsTypeFolder,
    getFileList,
    deleteFile,
  } from "./FsFile";
  import {
    openDirPicker,
    readDir,
    supportsFileSystem,
    verifyHandlePermission,
  } from "../fileutil";
  import { sortEntries } from "../wc/Folder.svelte";
  import {
    fsFileFromFavEntry,
    favorites,
    recent,
    browseFolders,
  } from "./np2store";
  import { arrayRemove, len, throwIf } from "../util";

  export let open = false;
  /** @type {Function} */
  export let onDone;

  /** @type {Entry}*/
  let selected = null;
  let removeTitle = "Remove";
  let btnRemoveDisabled = true;

  let btnAddFolderDisabled = false;
  let path = "";

  /** @type {Entry[]} */
  let entries = [];

  $: updateRemove(selected);

  /**
   * @param {Entry} e
   */
  function updateRemove(e) {
    console.log("updateRemove:", e);
    btnRemoveDisabled = !e || !e.remove;
    if (e && e.removeTitle) {
      removeTitle = e.removeTitle;
    }
  }

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
      console.log("btnOpenFolderClicked: no dirHandle");
      return;
    }
    $browseFolders = $browseFolders.concat(dirHandle);
    await setTopLevel(null);
  }

  async function btnRemoveClicked() {
    if (selected && selected.remove) {
      selected.remove(selected);
      selected = null;
    }
  }

  function close() {
    open = false;
    onDone(null);
  }

  /**
   * @param {Entry} e
   */
  async function openDirHandle(e) {
    await setDirHandle(e);
  }

  /**
   * @param {Entry} e
   */
  async function openDirHandleParent(e) {
    if (e.parent === null) {
      await setTopLevel(null);
      return;
    }
    await setDirHandle(e.parent);
  }

  /**
   * @param {Entry} e
   */
  async function setDirHandle(e) {
    let dh = e.dirHandle;
    console.log("setDirHandle:", dh, "parent:", e.parent);
    const ok = await verifyHandlePermission(dh, false);
    if (!ok) {
      return;
    }

    btnAddFolderDisabled = true;

    path = dh.name;
    let p = e.parent;
    // TODO: remove when tested not needed
    while (p && p != p.parent) {
      path = p.dirHandle.name + "/" + path;
      p = p.parent;
    }

    // TODO: cache things
    $progress = `reading ${dh.name}`;
    const fsEntry = await readDir(dh);
    $progress = "";
    /** @type {Function} */
    let open = setTopLevel;
    if (e.parent != null) {
      open = openDirHandle;
    }
    /** @type {Entry} */
    let e2 = {
      name: "..",
      parent: e.parent,
      dirHandle: dh,
      open: openDirHandleParent,
    };
    let a = [e2];
    let fsEntries = fsEntry.dirEntries;
    sortEntries(fsEntries);
    for (const fse of fsEntries) {
      if (fse.isDir) {
        e2 = {
          name: fse.name + "/",
          parent: e,
          open: openDirHandle,
          dirHandle: fse.handle,
        };
      } else {
        const fsf = new FsFile(fsTypeFolder, fse.name, fse.name);
        fsf.fileHandle = fse.handle;
        e2 = {
          name: fse.name,
          parent: e,
          open: openFile,
          file: fsf,
          dirHandle: null,
        };
      }
      a.push(e2);
    }
    entries = a;
  }

  /**
   * @param {Entry[]} a
   * @param {FavEntry[]} favs
   * @returns {Entry[]}
   */
  function addFavs(a, favs) {
    for (const fav of favs) {
      const fsf = fsFileFromFavEntry(fav);
      const e = {
        name: fav.favName,
        parent: null,
        file: fsf,
        fav: fav,
        open: openFile,
      };
      a.push(e);
    }
    return a;
  }

  /**
   * @param {Entry} e
   */
  function removeRecent(e) {
    console.log("removeRecent:", e);
    $recent = arrayRemove($recent, e.fav);
    openRecent(null);
  }

  /**
   * @param {Entry} ignore
   */
  async function openRecent(ignore) {
    btnAddFolderDisabled = true;
    path = "recent";
    /** @type {Entry} */
    let e = {
      name: "..",
      parent: null,
      open: setTopLevel,
    };
    entries = addFavs([e], $recent);
    for (let e of entries) {
      e.remove = removeRecent;
      e.removeTitle = "Remove";
    }
  }

  /**
   * @param {Entry} e
   */
  function removeFavorite(e) {
    console.log("removeFavorite:", e);
    $favorites = arrayRemove($favorites, e.fav);
    openFavorites(null);
  }

  /**
   * @param {Entry} ignore
   */
  async function openFavorites(ignore) {
    btnAddFolderDisabled = true;
    path = "favorites";
    /** @type {Entry} */
    let e = {
      name: "..",
      parent: null,
      open: setTopLevel,
    };
    entries = addFavs([e], $favorites);
    for (let e of entries) {
      e.remove = removeFavorite;
      e.removeTitle = "Remove";
    }
  }

  function showingTopLevel() {
    // TODO: a hack
    return len(entries) > 0 && entries[0].name === "browser";
  }

  // show new list of folders if changed in another tab
  browseFolders.subscribe((ignore) => {
    if (showingTopLevel()) {
      setTopLevel(null);
    }
  });

  /**
   * @param {Entry} ignore
   */
  async function setTopLevel(ignore) {
    btnAddFolderDisabled = false;
    path = "";
    /** @type {Entry} */
    let e = {
      name: "browser",
      parent: null,
      open: openBrowser,
    };
    let a = [e];
    if (len($recent) > 0) {
      e = {
        name: "recent",
        parent: null,
        open: openRecent,
      };
      a.push(e);
    }
    if (len($favorites) > 0) {
      e = {
        name: "favorites",
        parent: null,
        open: openFavorites,
      };
      a.push(e);
    }

    for (const dh of $browseFolders) {
      e = {
        name: dh.name,
        parent: null,
        dirHandle: dh,
        open: openDirHandle,
        remove: removeFolder,
        removeTitle: "Remove",
      };
      a.push(e);
    }
    entries = a;
  }

  async function removeFolder(e) {
    let idx = $browseFolders.indexOf(e.dirHandle);
    throwIf(idx < 0);
    $browseFolders.splice(idx, 1);
    browseFolders.set($browseFolders);
    setTopLevel(null);
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
  async function removeBrowserFile(e) {
    console.log("removeBrowseFile", e);
    // throwIf(e.parent !== null);
    await deleteFile(e.file);
    await openBrowser(null);
  }

  /**
   * @param {Entry} parent
   */
  async function openBrowser(parent) {
    btnAddFolderDisabled = true;
    path = "browser";
    /** @type {Entry} */
    let e1 = {
      name: "..",
      parent: parent,
      open: setTopLevel,
    };
    let a = [e1];
    const files = await getFileList(fsTypeIndexedDB);
    for (const f of files) {
      /** @type {Entry} */
      const e2 = {
        name: f.name,
        parent: parent,
        file: f,
        open: openFile,
        remove: removeBrowserFile,
        removeTitle: "Delete",
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
  <div slot="main" class="flex flex-col">
    <div class="mx-5 text-xs mt-2 min-h-[1rem]">{path}</div>
    <div
      class="flex mx-4 px-2 py-2 flex-col overflow-auto border-2 my-2 min-h-[12rem] max-h-[60vh] cursor-pointer select-none text-xs"
      tabindex="0"
      role="listbox"
    >
      {#each entries as f}
        {@const isBold = f.name.endsWith("/")}
        {@const boldCls = isBold ? "font-bold" : ""}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        {#if f === selected}
          <div
            class="{boldCls} bg-gray-100 hover:bg-gray-200"
            on:dblclick={() => entryDblClicked(f)}
            on:click={() => entryClicked(f)}
          >
            {f.name}
          </div>
        {:else}
          <div
            class="{boldCls} hover:bg-gray-200"
            on:dblclick={() => entryDblClicked(f)}
            on:click={() => entryClicked(f)}
          >
            {f.name}
          </div>
        {/if}
      {/each}
    </div>
  </div>
  <!-- bottom -->
  <div
    slot="bottom"
    class="flex mx-2 justify-between text-select-none text-xs items-baseline"
  >
    {#if supportsFileSystem()}
      <button
        disabled={btnAddFolderDisabled}
        class="btn-dlg px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500 disabled:text-gray-200 disabled:border-0 disabled:bg-white"
        on:click={btnOpenFolderClicked}>Add Folder</button
      >
    {/if}
    <button
      disabled={btnRemoveDisabled}
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500 disabled:text-gray-200 disabled:border-0 disabled:bg-white"
      on:click={btnRemoveClicked}>{removeTitle}</button
    >

    <div class="grow" />

    <!-- <button
      disabled={btnOpenDisabled}
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500 disabled:text-gray-200 disabled:border-0 disabled:bg-white"
      on:click={btnOpenClicked}>Open</button
    > -->
    <!-- <button
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      use:focus
      on:click={close}>Close</button
    > -->
    <a
      target="_blank"
      rel="noreferrer"
      class="text-blue-700 underline mr-2"
      href="https://docs.onlinetool.io/notepad2-browse-files"
    >
      help</a
    >
  </div>
</WinDialogBaseNoOverlay>
