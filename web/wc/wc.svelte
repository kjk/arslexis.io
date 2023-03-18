<script context="module">
</script>

<script>
  import TopNav from "../TopNav.svelte";
  import Folder, {
    calcDirSizes,
    calcLineCounts,
    setExcluded,
  } from "./Folder.svelte";
  import Messages from "../Messages.svelte";
  import Progress, { progress } from "../Progress.svelte";
  import ShowSupportsFileSystem from "../ShowSupportsFileSystem.svelte";
  import { recent } from "./wcstore";
  import {
    verifyHandlePermission,
    supportsFileSystem,
    readDirRecur,
    forEachFsEntry,
  } from "../fileutil";
  import { fmtNum, fmtSize, len } from "../util";

  /** @typedef {import("./wcstore").RecentEntry} RecentEntry */
  /** @typedef {import("../fileutil").FsEntry} FsEntry */

  /** @type {FsEntry} */
  let dirRoot = null;

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
    let di = await readDirRecur(dirHandle, shouldSkipEntry, "");
    forEachFsEntry(di, shouldExclude);
    calcDirSizes(di);
    dirRoot = di;
    await calcLineCounts(di, (dirInfo) => {
      $progress = `Calculating line counts ${dirInfo.path}`;
    });
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
    await calcLineCounts(dirRoot, null);
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
    {#if !dirRoot}
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
    {#if dirRoot}
      {@const meta = dirRoot.meta}
      {@const e = dirRoot}
      {#key dirRoot}
        <div class="font-bold font-mono mt-2">{e.name}/</div>
        <table class="relative table-auto">
          <thead>
            <tr class="relative even:bg-gray-50">
              <th class="sticky top-0 bg-white">name</th>
              <th class="sticky top-0 bg-white px-1">size</th>
              <th class="sticky top-0 bg-white px-1">dirs</th>
              <th class="sticky top-0 bg-white px-1">files</th>
              <th class="sticky top-0 bg-white px-1">lines</th>
              <!-- delete -->
              <th class="sticky top-0 bg-white px-1 bg-white" />
              <!-- exclude / include -->
              <th class="sticky top-0 bg-white px-1 bg-white" />
            </tr>
          </thead>
          <tbody>
            <tr class="bg-gray-100">
              <td class="text-left">totals:</td>
              <td class="pl-2 text-right whitespace-nowrap">
                {fmtSize(e.size)}
              </td>
              <td class="pl-2 text-right">{fmtNum(meta.dirs)}</td>
              <td class="pl-2 text-right">{fmtNum(meta.files)}</td>
              <td class="pl-2 text-right">{fmtNum(meta.linecount || 0)}</td>
              <!-- delete -->
              <td class="bg-white" />
              <!-- exclude / include -->
              <td class="bg-white" />
            </tr>

            <Folder {recalc} dirInfo={dirRoot} indent={0} />
          </tbody>
        </table>
      {/key}
    {/if}
  </div>
  <div class="mt-4" />
{/if}

<Progress />

<Messages />
