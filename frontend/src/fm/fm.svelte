<script>
  import TopNav from "../TopNav.svelte";
  import Folder from "./Folder.svelte";
  import Messages from "../Messages.svelte";
  import Progress, { progress } from "../Progress.svelte";
  import ShowSupportsFileSystem from "../ShowSupportsFileSystem.svelte";
  import { recent } from "./fmstore";
  import { verifyHandlePermission, supportsFileSystem } from "../fileutil";
  import { logFmEvent } from "../events";
  import { len, sleep } from "../util";
  import { readFileSysDirRecur, calcDirSizes } from "../fs";
  import { tick } from "svelte";

  /** @typedef {import("../fs").FsEntry} FsEntry */
  /** @typedef {import("../fs").FileSysDir} FileSysDir */

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
      initialSelectionIdx = entrySel[1];
      return;
    }
    dirRoot = null;
    initialSelectionIdx = -1;
  }

  $progress = "";

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

  /**
   * @param {FileSystemDirectoryHandle} dirHandle
   */
  async function openDirectory(dirHandle) {
    await verifyHandlePermission(dirHandle, false);
    fs = null;
    dirPath = [];
    $progress = "Reading directory entries...";
    function cbProgress(fs, dirName, nFiles, nDirs, finished) {
      let msg = `Reading ${dirName}, so far: ${nFiles} files, ${nDirs} dirs`;
      // console.log(msg);
      $progress = msg;
    }

    function finish(fsTemp) {
      logFmEvent("openDir");
      calcDirSizes(fsTemp);
      // TODO: handle no files
      let root = fsTemp.rootEntry();
      let selectedIdx = 0;
      dirRoot = root;
      dirPath = [[root, selectedIdx]];
      $progress = "";
      fs = fsTemp;
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
   * @param {FsEntry} dirEntry
   */
  function handleSelected(dirEntry, idx) {
    // if (dirEntry.name === "..") {
    //   handleGoUp();
    //   return;
    // }
    dirPath.push([dirEntry, idx]);
    dirPath = dirPath;
  }

  function handleGoUp() {
    let n = len(dirPath);
    if (n > 1) {
      dirPath.pop();
      dirPath = dirPath;
    }
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
    <div class="flex font-bold font-mono text-sm ml-3">
      {#each dirPath as e}
        <div class="ml-1">{fs.entryName(e[0])}</div>
        <div class="ml-1">/</div>
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

<Progress />

<Messages />
