<svelte:options runes={true} />

<script>
  import TopNav from "../TopNav.svelte";
  import Folder, {
    updateFilesLineCount,
    calcTotals,
    setExcluded,
  } from "./Folder.svelte";
  import Messages from "../Messages.svelte";
  import Progress2 from "../Progress2.svelte";
  import ShowSupportsFileSystem from "../ShowSupportsFileSystem.svelte";
  import { recent } from "./wcstore";
  import { verifyHandlePermission, supportsFileSystem } from "../fileutil";
  import { fmtNum, fmtSize, len } from "../util";
  import { logWcEvent } from "../events";
  import { readFileSysDirRecur, fsVisitDirs } from "../fs";
  import { includesStringNoCase } from "../strutil";

  /** @typedef {import("../fs").FsEntry} FsEntry */
  /** @typedef {import("../fs").FileSys} FileSys */
  /** @typedef {import("../fs").FileSysDir} FileSysDir */
  /** @typedef {import("../fs").ReadFilesCbArgs} ReadFilesCbArgs */

  /** @type {FileSysDir} */
  let fs = $state(null);

  /** @type {FsEntry} */
  let dirRoot = $state(-1);

  let progressHTML = $state("");

  let hasFileSystemSupport = supportsFileSystem();

  const defaultExcludeDirs = [".git", "node_modules", "dist"];
  const defaultExcludeFiles = ["package-lock.json", "yarn.lock", "bun.lockb"];

  function markDefaultExcluded(fs) {
    /**
     * @param {FileSys} fs
     * @param {FsEntry} de : directory entry
     * @returns {boolean}
     */
    function mark(fs, de) {
      let name = fs.entryName(de);
      let isExcluded = includesStringNoCase(defaultExcludeDirs, name);
      setExcluded(fs, de, isExcluded);
      if (isExcluded) {
        return false; // skip traversing sub-directories
      }
      for (let c of fs.entryChildren(de)) {
        if (fs.entryIsDir(c)) {
          continue;
        }
        name = fs.entryName(c);
        isExcluded = includesStringNoCase(defaultExcludeFiles, name);
        setExcluded(fs, de, isExcluded);
      }
      return true;
    }
    fsVisitDirs(fs, mark);
  }

  // called when user includes / excludes stuff
  // we need to update totals
  async function recalc() {
    // console.log("finished calcDIrSizes");
    await updateFilesLineCount(fs, null);
    calcTotals(fs);
    dirRoot = dirRoot;
    fs = fs;
    console.log("fnished recalc");
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

  let fsStack = [];

  /**
   * @param {FileSystemDirectoryHandle} dirHandle
   */
  async function openDirectory(dirHandle) {
    console.log("openDirectory:", dirHandle);
    await verifyHandlePermission(dirHandle, false);
    fs = null;
    dirRoot = -1;
    progressHTML = "<div>Reading directory entries...</div>";
    let fsTemp;

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
      let msg = `<div class="flex"><div>Reading <b>${a.dirName}</b></div><div class="grow"></div><div>${a.fileCount} files, ${a.dirCount} dirs, ${sizeStr}</div></div>`;
      // console.log(msg);
      progressHTML = msg;
      return true;
    }

    try {
      fsTemp = await readFileSysDirRecur(dirHandle, cbProgress);
    } catch (e) {
      console.log("error reading dir", e);
      // can fail if e.g. saved directory was deleted
      progressHTML = "";
      return;
    }
    fsStack = [];
    logWcEvent("openDir");
    markDefaultExcluded(fsTemp);
    dirRoot = fsTemp.rootEntry();
    fs = fsTemp;
    function onDir(de) {
      let name = fs.entryName(de);
      console.log("calcLineCountsCb:", de, name);
      progressHTML = `<div>Calculating line counts in dir <b>${name}</b></div>`;
    }
    await updateFilesLineCount(fs, onDir);
    calcTotals(fs);
    progressHTML = "";
    fs = fs;
    // dirRoot = dirRoot;
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
</script>

<TopNav>
  <span class="text-purple-800"><tt>wc</tt> in the browser</span>
  {#if fs}
    <button
      class="border ml-2 text-sm border-gray-500 px-2 py-0.5 hover:bg-gray-100"
      onclick={openFolder}>Open another folder</button
    >
    {#if len($recent) > 0}
      <div class="flex ml-4 text-sm">
        <div>recent:</div>
        {#each $recent as e}
          <button
            class="ml-2 underline"
            onclick={() => openRecentDir(e.dirHandle)}>{e.name}</button
          >{/each}
      </div>
    {/if}
  {/if}
</TopNav>

<ShowSupportsFileSystem />

{#if hasFileSystemSupport && !fs}
  {#if len($recent) > 0}
    <div class="ml-4 mt-2 mb-2">
      <div>Recently opened:</div>
      <table class="table-auto ml-4">
        <tbody>
          {#each $recent as e, idx}
            <tr>
              <td class="px-1">{e.name}</td>
              <td class="px-1"
                ><button
                  class="underline hover:cursor-pointer"
                  onclick={() => openRecentDir(e.dirHandle)}>open</button
                ></td
              >
              <td class="px-1">
                <button
                  class="underline hover:cursor-pointer"
                  onclick={() => removeFromRecent(idx)}>remove</button
                >
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <div class="flex items-baseline mx-4 mt-2 mb-2">
    <button
      class="border border-gray-500 px-2 py-0.5 hover:bg-gray-100"
      onclick={openFolder}>Open folder</button
    >
    <div class="ml-2">
      from your computer to calculate file sizes etc., like <tt>wc</tt>.
    </div>
  </div>
{/if}

{#key fs}
  {#if fs}
    <div class="mx-4 mt-2 text-sm font-mono">
      {#if dirRoot !== -1}
        {@const e = dirRoot}
        {@const size = fs.entryMeta(e, "size") || 0}
        {@const metaDirs = fs.entryMeta(e, "dirs") || 0}
        {@const metaFiles = fs.entryMeta(e, "files") || 0}
        {@const metaLineCount = fs.entryMeta(e, "linecount") || 0}
        {@const name = fs.entryName(e)}
        <div class="font-bold font-mono mt-2">{name}/</div>
        <table class="relative table-auto">
          <thead>
            <tr class="relative even:bg-gray-50">
              <th class="sticky top-0 bg-white">name</th>
              <th class="sticky top-0 bg-white px-1">size</th>
              <th class="sticky top-0 bg-white px-1">dirs</th>
              <th class="sticky top-0 bg-white px-1">files</th>
              <th class="sticky top-0 bg-white px-1">lines</th>
              <!-- delete -->
              <th class="sticky top-0 px-1 bg-white"></th>
              <!-- exclude / include -->
              <th class="sticky top-0 px-1 bg-white"></th>
            </tr>
          </thead>
          <tbody>
            <tr class="bg-gray-100">
              <td class="text-left">totals:</td>
              <td class="pl-2 text-right whitespace-nowrap">
                {fmtSize(size)}
              </td>
              <td class="pl-2 text-right">{fmtNum(metaDirs)}</td>
              <td class="pl-2 text-right">{fmtNum(metaFiles)}</td>
              <td class="pl-2 text-right">{fmtNum(metaLineCount)}</td>
              <!-- delete -->
              <td class="bg-white"></td>
              <!-- exclude / include -->
              <td class="bg-white"></td>
            </tr>

            <Folder {fs} {recalc} {dirRoot} indent={0} />
          </tbody>
        </table>
      {/if}
    </div>
  {/if}
{/key}
<div class="mt-4"></div>

<Progress2 msgHTML={progressHTML} />

<Messages />
