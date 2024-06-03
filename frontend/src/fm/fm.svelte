<script>
  import TopNav from "../TopNav.svelte";
  import Folder from "./Folder.svelte";
  import Messages from "../Messages.svelte";
  import Progress2 from "../Progress2.svelte";
  import ShowSupportsFileSystem from "../ShowSupportsFileSystem.svelte";
  import { recent } from "./fmstore";
  import { verifyHandlePermission, supportsFileSystem } from "../fileutil";
  import { logFmEvent } from "../events";
  import { fmtSize, len } from "../util";
  import { readFileSysDirRecur, calcDirSizes } from "../fs";

  /** @typedef {import("../fs").FsEntry} FsEntry */
  /** @typedef {import("../fs").FileSysDir} FileSysDir */
  /** @typedef {import("../fs").ReadFilesCbArgs} ReadFilesCbArgs */

  /** @type {FileSysDir} */
  let fs = null;

  /** @type {any[][]} */
  let dirPath = [];

  /** @type {FsEntry} */
  let dirRoot = -1;
  $: calcDirRoot(dirPath);
  let initialSelectionIdx = 0;

  function calcDirRoot(dirPath) {
    console.log("calcDirRoot:", dirPath);
    let n = len(dirPath);
    if (n > 0) {
      let entrySel = dirPath[n - 1];
      dirRoot = entrySel[0];
      return;
    }
    dirRoot = null;
    initialSelectionIdx = 0;
  }

  let progressHTML = "";

  let hasFileSystemSupport = supportsFileSystem();

  /**
   * @param {FileSystemDirectoryHandle} dh
   */
  async function addToRecent(dh) {
    // note: no way to check for duplicates
    // dirHandle for a directory doesn't compare equal
    // to another dirHandle for the same directory
    // we can't filter by name becaues multiple directories
    // on disk can have the same name
    let e = {
      dirHandle: dh,
      name: dh.name,
    };
    $recent.push(e);
    $recent = $recent;
  }

  async function removeFromRecent(idx) {
    $recent.splice(idx, 1);
    $recent = $recent;
  }

  let fsStack = [];
  /**
   * @param {FileSystemDirectoryHandle} dirHandle
   */
  async function openDirectory(dirHandle) {
    await verifyHandlePermission(dirHandle, false);
    fs = null;
    dirPath = [];
    progressHTML = "<div>Reading directory entries...</div>";

    /**
     * @param {ReadFilesCbArgs} a
     * @returns {boolean}
     */
    function cbProgress(a) {
      // interrupt scans in progress if we started a new one
      if (!fsStack.includes(a.fs)) {
        fsStack.push(a.fs);
      } else {
        let lastIdx = len(fsStack) - 1;
        if (a.fs !== fsStack[lastIdx]) {
          return false;
        }
      }
      let sizeStr = fmtSize(a.totalSize);
      let msg = `<div class="flex"><div>Reading <b>${a.dirName}</b></div><div class="flex-grow"></div><div>${a.fileCount} files, ${a.dirCount} dirs, ${sizeStr}</div></div>`;
      // console.log(msg);
      progressHTML = msg;
      return true;
    }

    function finish(fsTemp) {
      if (!fsTemp) {
        // was interrupted
        return;
      }
      logFmEvent("openDir");
      calcDirSizes(fsTemp);
      // TODO: handle no files
      let root = fsTemp.rootEntry();
      dirRoot = root;
      let selectedIdx = 0;
      dirPath = [[root, selectedIdx]];
      progressHTML = "";
      fs = fsTemp;
      fsStack = [];
    }
    readFileSysDirRecur(dirHandle, cbProgress).then(finish);
  }

  /**
   * @param {FileSystemDirectoryHandle} dirHandle
   */
  async function openRecentDir(dirHandle) {
    try {
      await verifyHandlePermission(dirHandle, false);
    } catch {
      // didn't get permission
      return;
    }
    openDirectory(dirHandle);
  }

  async function openFolder() {
    /** @type {FileSystemDirectoryHandle} */
    let dirHandle;
    try {
      // @ts-ignore
      dirHandle = await window.showDirectoryPicker();
    } catch {
      // dismissed dialog or no permissions
      return;
    }
    addToRecent(dirHandle);
    openDirectory(dirHandle);
  }

  async function recalc() {
    calcDirSizes(fs);
    // console.log("finished calcDIrSizes");
    dirRoot = dirRoot;
  }

  /**
   * @param {FsEntry} e
   */
  function handleSelected(e, idx) {
    let name = fs.entryName(e);
    if (name === "..") {
      handleGoUp();
      return;
    }
    // remember current directory and current selection
    dirPath.push([e, idx]);
    initialSelectionIdx = 0;
    dirPath = dirPath;
  }

  function handleGoUp() {
    let n = len(dirPath);
    if (n < 2) {
      // don't go beyond root directory
      return;
    }
    let a = dirPath.pop();
    initialSelectionIdx = a[1]; // restore selection for popped directory
    dirPath = dirPath;
  }
</script>

<div class="h-screen fixed inset-0 flex flex-col overflow-y-hidden">
  <TopNav>
    <span class="text-purple-800">File Manager in the browser</span>
    {#if fs}
      <button
        class="border ml-2 text-sm border-gray-500 px-2 py-0.5 hover:bg-gray-100"
        on:click={openFolder}>Open another folder</button
      >
      {#if len($recent) > 0}
        <div class="flex ml-4 text-sm">
          <div>recent:</div>
          {#each $recent as e}
            <button
              class="ml-2 underline"
              on:click={() => openRecentDir(e.dirHandle)}>{e.name}</button
            >{/each}
        </div>
      {/if}
    {/if}
  </TopNav>

  {#if hasFileSystemSupport}
    {#if !fs}
      <div class="flex items-baseline mx-4 mt-2 mb-2">
        <button
          class="border border-gray-500 px-2 py-0.5 hover:bg-gray-100"
          on:click={openFolder}>Open folder</button
        >
        <div class="ml-2">from your computer to browse it.</div>
      </div>
    {/if}
  {:else}
    <ShowSupportsFileSystem />
  {/if}

  {#if !fs}
    {#if len($recent) > 0}
      <div class="ml-4 mt-2 mb-2">
        <div>Recently opened:</div>
        <table class="table-auto ml-4">
          {#each $recent as e, idx}
            <tr>
              <td class="px-1">{e.name}</td>
              <td class="px-1"
                ><button
                  class="underline hover:cursor-pointer"
                  on:click={() => openRecentDir(e.dirHandle)}>open</button
                ></td
              >
              <td class="px-1">
                <button
                  class="underline hover:cursor-pointer"
                  on:click={() => removeFromRecent(idx)}>remove</button
                >
              </td>
            </tr>
          {/each}
        </table>
      </div>
    {/if}
  {/if}

  {#if fs}
    {@const isUpEnabled = len(dirPath) > 1}
    <div class="flex font-bold font-mono text-sm ml-3">
      <button
        disabled={!isUpEnabled}
        class="hover:bg-gray-200 disabled:hover:bg-white disabled:text-gray-300 px-[4px] mr-0.5"
        on:click={handleGoUp}>▲</button
      >
      {#each dirPath as e, idx}
        {@const isLast = len(e) === idx + 1}
        <div class="ml-1">{fs.entryName(e[0])}</div>
        {#if !isLast}
          <div class="ml-1">/</div>
        {/if}
      {/each}
    </div>
    {#key dirRoot}
      <div class="overflow-y-scroll h-min-0 h-full ml-2">
        <Folder
          {initialSelectionIdx}
          {recalc}
          {fs}
          {dirRoot}
          isRoot={len(dirPath) == 1}
          indent={0}
          onSelected={handleSelected}
          onGoUp={handleGoUp}
        />
      </div>
    {/key}
  {/if}
</div>

<div class="mt-4" />

<Progress2 msgHTML={progressHTML} />

<Messages />
