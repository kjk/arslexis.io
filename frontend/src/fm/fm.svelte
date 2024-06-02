<script context="module">
</script>

<script>
  import TopNav from "../TopNav.svelte";
  import Folder, { calcDirSizes, setExcluded } from "./Folder.svelte";
  import Messages from "../Messages.svelte";
  import Progress, { progress } from "../Progress.svelte";
  import ShowSupportsFileSystem from "../ShowSupportsFileSystem.svelte";
  import { recent } from "./fmstore";
  import {
    verifyHandlePermission,
    supportsFileSystem,
    readDirRecur,
    forEachFsEntry,
  } from "../fileutil";
  import { fmtNum, fmtSize, len } from "../util";
  import { logFmEvent } from "../events";

  /** @typedef {import("./fmstore").RecentEntry} RecentEntry */
  /** @typedef {import("../fileutil").FsEntry} FsEntry */

  /** @type {FsEntry} */
  let dirRoot = null;

  // /** @type {boolean} */
  // let isShowingFiles = false;
  // $: isShowngFiles = dirRoot != null;

  $progress = "";

  let hasFileSystemSupport = supportsFileSystem();

  let defaultExcludeDirs = [".git", "node_modules", "dist"];
  let defaultExcludeFiles = ["package-lock.json", "yarn.lock"];

  /**
   * @param {FsEntry} entry
   */
  function shouldExclude(entry) {
    let name = entry.name.toLowerCase();
    let exclude;
    if (entry.isDir) {
      exclude = defaultExcludeDirs.includes(name);
    } else {
      exclude = defaultExcludeFiles.includes(name);
    }
    if (exclude) {
      setExcluded(entry, exclude);
    }
    return exclude;
  }

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
   * @param {string} dir
   * @returns {boolean}
   */
  function shouldSkipEntry(entry, dir) {
    // use it to show progress
    if (entry.kind === "directory") {
      $progress = `Reading ${dir}`;
    }
    return false;
  }

  /**
   * @param {FileSystemDirectoryHandle} dirHandle
   */
  async function openDirectory(dirHandle) {
    await verifyHandlePermission(dirHandle, false);
    dirRoot = null;
    $progress = "Reading directory entries...";
    let di;
    try {
      di = await readDirRecur(dirHandle, shouldSkipEntry, "");
    } catch (e) {
      console.log("error reading dir", e);
      // can fail if e.g. saved directory was deleted
      $progress = "";
      return;
    }
    logFmEvent("openDir");
    forEachFsEntry(di, shouldExclude);
    calcDirSizes(di);
    dirRoot = di;
    $progress = "";
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
    calcDirSizes(dirRoot);
    // console.log("finished calcDIrSizes");
    dirRoot = dirRoot;
  }
</script>

<div class="h-screen fixed inset-0 flex flex-col overflow-y-hidden">
  <TopNav>
    <span class="text-purple-800">File Manager in the browser</span>
    {#if dirRoot}
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
    {#if !dirRoot}
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

  {#if !dirRoot}
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

  {#if dirRoot}
    {@const e = dirRoot}
    {#key dirRoot}
      <div class="font-bold font-mono text-sm ml-2">{e.name}/</div>
      <div class="overflow-y-scroll h-min-0 h-full ml-2">
        <table class="table-auto font-mono text-sm">
          <tbody>
            <Folder {recalc} {dirRoot} indent={0} />
          </tbody>
        </table>
      </div>
    {/key}
  {/if}
</div>

<div class="mt-4" />

<Progress />

<Messages />
