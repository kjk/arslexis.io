<script>
  import TopNav from "../TopNav.svelte";
  import Folder, { calcLineCounts, setExcluded } from "./Folder.svelte";
  import Messages from "../Messages.svelte";
  import Progress2 from "../Progress2.svelte";
  import ShowSupportsFileSystem from "../ShowSupportsFileSystem.svelte";
  import { recent } from "./wcstore";
  import { verifyHandlePermission, supportsFileSystem } from "../fileutil";
  import { fmtNum, fmtSize, len } from "../util";
  import { logWcEvent } from "../events";
  import { readFileSysDirRecur, calcDirSizes } from "../fs";

  /** @typedef {import("../fs").FsEntry} FsEntry */
  /** @typedef {import("../fs").FileSysDir} FileSysDir */
  /** @typedef {import("../fs").ReadFilesCbArgs} ReadFilesCbArgs */

  /** @type {FileSysDir} */
  let fs = null;

  /** @type {FsEntry} */
  let dirRoot = -1;

  let progressHTML = "";

  let hasFileSystemSupport = supportsFileSystem();

  let defaultExcludeDirs = [".git", "node_modules", "dist"];
  let defaultExcludeFiles = ["package-lock.json", "yarn.lock"];

  /**
   * @param {FsEntry} e
   */
  function shouldExclude(fs, e) {
    let name = fs.entryName(e).toLowerCase();
    let exclude;
    let isDir = fs.entryIsDir(e);
    if (isDir) {
      exclude = defaultExcludeDirs.includes(name);
    } else {
      exclude = defaultExcludeFiles.includes(name);
    }
    if (exclude) {
      setExcluded(fs, e, exclude);
    }
    return exclude;
  }

  /**
   * @param {FileSysDir} fs
   * @param {Function} fn
   */
  export function forEachFsEntry(fs, e, fn) {
    let entries = fs.entryChildren(e);
    for (let e of entries) {
      let skip = fn(fs, e);
      let isDir = fs.entryIsDir(e);
      if (!skip && isDir) {
        forEachFsEntry(fs, e, fn);
      }
    }
    fn(fs, e);
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
      let msg = `<div class="flex"><div>Reading <b>${a.dirName}</b></div><div class="flex-grow"></div><div>${a.fileCount} files, ${a.dirCount} dirs, ${sizeStr}</div></div>`;
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
    logWcEvent("openDir");
    forEachFsEntry(fsTemp, fsTemp.rootEntry, shouldExclude);
    calcDirSizes(fsTemp);
    fs = fsTemp;
    dirRoot = fsTemp.rootEntry();
    await calcLineCounts(fsTemp, dirRoot, (e) => {
      let name = fsTemp.entryName(e);
      progressHTML = `<div>Calculating line counts ${name}</div>`;
    });
    progressHTML = "";
    dirRoot = dirRoot;
    fsStack = [];
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
    await calcLineCounts(fs, dirRoot, null);
    // console.log("fnished calcLineCounts");
    dirRoot = dirRoot;
  }
</script>

<TopNav>
  <span class="text-purple-800"><tt>wc</tt> in the browser</span>
</TopNav>

<ShowSupportsFileSystem />

{#if hasFileSystemSupport}
  <div class="flex items-baseline mx-4 mt-2 mb-2">
    <button
      class="border border-gray-500 px-2 py-0.5 hover:bg-gray-100"
      on:click={openFolder}>Open folder</button
    >
    <div class="ml-2">
      from your computer to calculate file sizes etc., like <tt>wc</tt>.
    </div>
  </div>

  {#if len($recent) > 0}
    {#if !fs}
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
    {:else}
      <div class="flex ml-4 mt-2 mb-2 text-sm">
        <div>Recently opened:</div>
        {#each $recent as e}
          <button class="ml-2" on:click={() => openRecentDir(e.dirHandle)}
            >{e.name}</button
          >{/each}
      </div>
    {/if}
  {/if}

  <div class="mx-4 mt-2 text-sm font-mono">
    {#if fs}
      {@const e = dirRoot}
      {@const metaDirs = fs.entryMeta(e, "dirs") || 0}
      {@const metaFiles = fs.entryMeta(e, "files") || 0}
      {@const metaLineCount = fs.entryMeta(e, "linecount") || 0}
      {@const name = fs.entryName(e)}
      {@const size = fs.entrySize(e)}
      {#key dirRoot}
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
              <th class="sticky top-0 px-1 bg-white" />
              <!-- exclude / include -->
              <th class="sticky top-0 px-1 bg-white" />
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
              <td class="bg-white" />
              <!-- exclude / include -->
              <td class="bg-white" />
            </tr>

            <Folder {fs} {recalc} {dirRoot} indent={0} />
          </tbody>
        </table>
      {/key}
    {/if}
  </div>
  <div class="mt-4" />
{/if}

<Progress2 msgHTML={progressHTML} />

<Messages />
