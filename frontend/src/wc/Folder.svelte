<script context="module">
  import { verifyHandlePermission, isBinary, lineCount } from "../fileutil";

  /** @typedef {import("../fs").FsEntry} FsEntry */
  /** @typedef {import("../fs").FileSys} FileSys */
  /** @typedef {import("../fs").FileSysDir} FileSysDir */

  /**
   * @param {FileSys} fs
   * @param {FsEntry} e
   * @returns {number}
   */
  export function getLineCount(fs, e) {
    return fs.entryMeta(e, "linecount") || 0;
  }

  /**
   * @param {FileSys} fs
   * @param {FsEntry} e
   * @param {number} n
   */
  export function setLineCount(fs, e, n) {
    fs.entrySetMeta(e, "linecount", n);
  }

  /**
   * @param {FileSys} fs
   * @param {FsEntry} e
   * @returns {boolean}
   */
  export function isExcluded(fs, e) {
    return fs.entryMeta(e, "excluded") || false;
  }

  /**
   * @param {FileSys} fs
   * @param {FsEntry} e
   * @param {boolean} excluded
   */
  export function setExcluded(fs, e, excluded) {
    fs.entrySetMeta(e, "excluded", excluded);
  }

  /**
   * @param {FileSys} fs
   * @param {FsEntry} e
   * @returns {boolean}
   */
  export function isExpanded(fs, e) {
    return fs.entryMeta(e, "expanded") || false;
  }

  /**
   * @param {FileSys} fs
   * @param {FsEntry} e
   * @param {boolean} expanded
   */
  export function setExpanded(fs, e, expanded) {
    fs.entrySetMeta(e, "expanded", expanded);
  }

  export function calcTotals(fs) {
    function updateMetaCount(e, key, n) {
      let curr = fs.entryMeta(e, key);
      throwIf(curr === undefined);
      fs.entrySetMeta(e, key, curr + n);
    }
    function resetTotalsOnDir(fs, de) {
      let allKeys = ["size", "files", "dirs", "linecount"];
      for (let key of allKeys) {
        fs.entrySetMeta(de, key, 0);
      }
      return true;
    }
    /**
     * @param {FileSys} fs
     * @param {FsEntry} de : directory entry
     * @returns {boolean}
     */
    function calc(fs, de) {
      if (isExcluded(fs, de)) {
        resetTotalsOnDir(fs, de);
        return false; // skip processing sub-directories
      }

      let sumFileSizes = 0;
      let nFiles = 0;
      let nDirs = 0;
      let nLines = 0;
      for (let ce of fs.entryChildren(de)) {
        if (fs.entryIsDir(ce)) {
          nDirs++;
          continue;
        }
        nFiles++;
        sumFileSizes += fs.entrySize(ce);
        nLines += getLineCount(fs, ce);
      }
      fs.entrySetMeta(de, "size", sumFileSizes);
      fs.entrySetMeta(de, "files", nFiles);
      fs.entrySetMeta(de, "dirs", nDirs);
      fs.entrySetMeta(de, "linecount", nLines);
      forEachParent(fs, de, (fs, pe) => {
        updateMetaCount(pe, "size", sumFileSizes);
        updateMetaCount(pe, "files", nFiles);
        updateMetaCount(pe, "dirs", nDirs);
        updateMetaCount(pe, "linecount", nLines);
      });
      return true;
    }
    fsVisitDirs(fs, resetTotalsOnDir);
    fsVisitDirs(fs, calc);
  }

  /**
   * @param {FileSysDir} fs
   * @param {(FsEntry) => void} onDir
   * @returns {Promise}
   */
  export async function updateFilesLineCount(fs, onDir) {
    let filesToProcess = [];
    function buildFilesToProcess(fs, de) {
      if (isExcluded(fs, de)) {
        return false;
      }
      for (let ce of fs.entryChildren(de)) {
        if (fs.entryIsDir(ce)) {
          continue;
        }
        let name = fs.entryName(ce);
        let skip = isExcluded(fs, ce) || isBinary(name);
        if (skip) {
          setLineCount(fs, ce, 0);
          continue;
        }
        let lc = getLineCount(fs, ce);
        if (lc > 0) {
          // already calculated line count
          continue;
        }
        filesToProcess.push(ce);
      }
      return true;
    }
    fsVisitDirs(fs, buildFilesToProcess);
    let currDir = -1;
    for (let e of filesToProcess) {
      if (onDir) {
        let de = fs.entryParent(e);
        if (de !== currDir) {
          currDir = de;
          onDir(currDir);
        }
      }

      let name = fs.entryName(e);
      let path = entryFullPath(fs, e);
      console.log("calcLineCount", e, name, path);
      let fh = await fs.entryFileHandle(e);
      console.log("before fh.getFile() for e:", e);
      let file = await fh.getFile();
      let lc = await lineCount(file);
      console.log(`file ${path} has ${lc} lines`);
      setLineCount(fs, e, lc);
    }
    console.log("updateFilesLineCount: finished");
  }
</script>

<script>
  import DialogConfirm from "../DialogConfirm.svelte";
  import { fmtNum, fmtSize, throwIf } from "../util";
  import { showInfoMessage } from "../Messages.svelte";
  import { onMount } from "svelte";
  import { logWcEvent } from "../events";
  import {
    entryFullPath,
    forEachParent,
    fsVisitDirs,
    sortEntries,
  } from "../fs";

  /** @type {FileSysDir} */
  export let fs;
  /** @type {FsEntry} */
  export let dirRoot;
  export let indent;
  /** @type {Function} */
  export let recalc;

  /** @type {FsEntry[]} */
  let entries = [];

  onMount(() => {
    // SUBTLE: important to not re-order dirRoot entries because
    // they could be used in calcLineCount()
    // we use and sort a copy
    let c = fs.entryChildren(dirRoot);
    /** @type {FsEntry[]} */
    entries = [].concat(c);
    sortEntries(fs, entries);
  });

  /**
   * @param {FsEntry} e
   */
  function toggleExpand(fs, e) {
    let expanded = isExpanded(fs, e);
    setExpanded(fs, e, !expanded);
    entries = entries;
  }

  let showingConfirmDelete = false;
  let toDeleteIdx;
  let confirmDeleteTitle = "";
  let confirmDeleteMessage = "";

  async function handleDelete() {
    let e = entries[toDeleteIdx];
    let name = fs.entryName(e);
    let isDir = fs.entryIsDir(e);
    let opts;
    if (isDir) {
      opts = {
        recursive: true,
      };
    }

    // re-ask for write permissions
    let parent = fs.entryParent(e);
    throwIf(!fs.entryIsDir(parent));
    let dirHandle = fs.handles[parent];
    await verifyHandlePermission(dirHandle, true);
    dirHandle.removeEntry(name, opts);

    // console.log("deleted:", name);
    entries.splice(toDeleteIdx, 1);
    entries = entries;
    showInfoMessage(`Deleted ${name}`);
    showingConfirmDelete = false;
    toDeleteIdx = -1;

    let evt = isDir ? "deleteFolder" : "deleteFile";
    logWcEvent(evt);
  }

  function deleteDirOrFile(idx) {
    let e = entries[idx];
    // console.log("deleteDirOrFile: idx:", idx, "e:", e);
    let name = fs.entryName(e);
    toDeleteIdx = idx;
    let isDir = fs.entryIsDir(e);
    let what = isDir ? "directory" : "file";
    confirmDeleteTitle = `Delete ${what} ${name}?`;
    confirmDeleteMessage = `Delete ${what} <b>${name}<b>?`;
    showingConfirmDelete = true;
  }

  async function doExclude(e, exclude) {
    setExcluded(fs, e, exclude);
    await recalc();
  }
</script>

{#key entries}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  {#each entries as e, idx}
    {@const name = fs.entryName(e)}
    {@const size = fs.entryMeta(e, "size") || 0}
    {@const metaDirs = fs.entryMeta(e, "dirs") || 0}
    {@const metaFiles = fs.entryMeta(e, "files") || 0}
    {@const metaLineCount = fs.entryMeta(e, "linecount") || 0}
    {@const isDir = fs.entryIsDir(e)}
    {@const excluded = isExcluded(fs, e)}
    {#if isDir}
      <tr
        on:click={() => toggleExpand(fs, e)}
        class="hover:bg-gray-200 hover:cursor-pointer pl-8"
      >
        <td class="ind-{indent} font-semibold">
          {#if isExpanded(fs, e)}
            ▼
          {:else}
            ▶
          {/if}
          {name}
        </td>
        <td class="pl-2 text-right whitespace-nowrap">
          {fmtSize(size)}
        </td>
        <td class="pl-2 text-right">{fmtNum(metaDirs)}</td>
        <td class="pl-2 text-right">{fmtNum(metaFiles)}</td>
        <td class="pl-2 text-right">{fmtNum(metaLineCount)}</td>
        <td class="text-center bg-white"
          ><button
            on:click|stopPropagation={() => deleteDirOrFile(idx)}
            class="hover:underline px-4 hover:text-red-600">delete</button
          ></td
        >
        {#if excluded}
          <td class="text-center bg-white"
            ><button
              on:click|stopPropagation={() => doExclude(e, false)}
              class="hover:underline px-4 text-blue-600">include</button
            ></td
          >
        {:else}
          <td class="text-center bg-white"
            ><button
              on:click|stopPropagation={() => doExclude(e, true)}
              class="hover:underline px-4">exclude</button
            ></td
          >
        {/if}
      </tr>
      {#if isExpanded(fs, e)}
        <svelte:self {fs} {recalc} dirRoot={e} indent={indent + 1} />
      {/if}
    {/if}
  {/each}
{/key}

{#each entries as e, idx (idx)}
  {@const name = fs.entryName(e)}
  {@const size = fs.entrySize(e)}
  {@const isDir = fs.entryIsDir(e)}
  {@const excluded = isExcluded(fs, e)}
  {#if !isDir}
    <tr class="hover:bg-gray-200 even:bg-gray-50">
      <td class="ind-{indent + 1}">{name} </td>
      <td class="pl-2 text-right whitespace-nowrap">{fmtSize(size)} </td>
      <td class="pl-2 text-right" />
      <td class="pl-2 text-right" />
      <td class="pl-2 text-right">{fmtNum(getLineCount(fs, e))}</td>
      <td class="text-center bg-white"
        ><button
          on:click={() => deleteDirOrFile(idx)}
          class="hover:underline px-4 hover:text-red-600">delete</button
        ></td
      >
      {#if excluded}
        <td class="text-center bg-white"
          ><button
            on:click|stopPropagation={() => doExclude(e, false)}
            class="hover:underline px-4 text-blue-600">include</button
          ></td
        >
      {:else}
        <td class="text-center bg-white"
          ><button
            on:click|stopPropagation={() => doExclude(e, true)}
            class="hover:underline px-4">exclude</button
          ></td
        >
      {/if}
    </tr>
  {/if}
{/each}

<DialogConfirm
  bind:open={showingConfirmDelete}
  message={confirmDeleteMessage}
  title={confirmDeleteTitle}
  confirmButton="Delete"
  onConfirm={handleDelete}
/>

<style>
  /*
  TODO: hacky because there can be more indentation levels
  */
  :global(.ind-1) {
    padding-left: 0.5rem;
  }
  :global(.ind-2) {
    padding-left: 1rem;
  }
  :global(.ind-3) {
    padding-left: 1.5rem;
  }
  :global(.ind-4) {
    padding-left: 2rem;
  }
  :global(.ind-5) {
    padding-left: 2.5rem;
  }
  :global(.ind-6) {
    padding-left: 3rem;
  }
  :global(.ind-7) {
    padding-left: 3.5rem;
  }
  :global(.ind-8) {
    padding-left: 4rem;
  }
  :global(.ind-9) {
    padding-left: 4.5rem;
  }
  :global(.ind-10) {
    padding-left: 5rem;
  }
  :global(.ind-11) {
    padding-left: 5.5rem;
  }
  :global(.ind-12) {
    padding-left: 6rem;
  }
  :global(.ind-13) {
    padding-left: 6.5rem;
  }
  :global(.ind-14) {
    padding-left: 7rem;
  }
  :global(.ind-15) {
    padding-left: 7.5rem;
  }
  :global(.ind-16) {
    padding-left: 8rem;
  }
  :global(.ind-17) {
    padding-left: 8.5rem;
  }
</style>
