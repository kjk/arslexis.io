<script context="module">
  import { strCompareNoCase } from "../strutil";
  import { verifyHandlePermission, isBinary, lineCount } from "../fileutil";

  /** @typedef {import("../fs").FsEntry} FsEntry */
  /** @typedef {import("../fs").FileSysDir} FileSysDir */
  /** @typedef {import("../fs").FileSys} FileSys */

  /**
   * @param {FileSysDir} fs
   * @param {FsEntry} e
   * @returns {number}
   */
  export function getLineCount(fs, e) {
    return fs.entryMeta(e, "linecount") || 0;
  }

  /**
   * @param {FileSysDir} fs
   * @param {FsEntry} e
   * @param {number} n
   */
  export function setLineCount(fs, e, n) {
    fs.entrySetMeta(e, "linecount", n);
  }

  /**
   * @param {FileSysDir} fs
   * @param {FsEntry} e
   * @returns {boolean}
   */
  export function isExcluded(fs, e) {
    return fs.entryMeta(e, "excluded") || false;
  }

  /**
   * @param {FileSysDir} fs
   * @param {FsEntry} e
   * @param {boolean} excluded
   */
  export function setExcluded(fs, e, excluded) {
    fs.entrySetMeta(e, "excluded", excluded);
  }

  /**
   * @param {FileSysDir} fs
   * @param {FsEntry} e
   * @returns {boolean}
   */
  export function isExpanded(fs, e) {
    return fs.entryMeta(e, "expanded") || false;
  }

  /**
   * @param {FileSysDir} fs
   * @param {FsEntry} e
   * @param {boolean} expanded
   */
  export function setExpanded(fs, e, expanded) {
    fs.entrySetMeta(e, "expanded", expanded);
  }

  /**
   * @param {FileSysDir} fs
   * @param {FsEntry} e
   */
  export function calcDirSizes(fs, e) {
    let size = 0;
    let files = 0;
    let dirs = 0;
    let entries = fs.entryChildren(e);
    for (let e of entries) {
      let excluded = isExcluded(fs, e);
      let isDir = fs.entryIsDir(e);
      if (isDir) {
        dirs++;
        let sizes = calcDirSizes(fs, e);
        if (excluded) {
          continue;
        }
        size += sizes.size;
        files += sizes.files;
        dirs += sizes.dirs;
      } else {
        if (excluded) {
          continue;
        }
        files++;
        size += fs.entrySize(e);
      }
    }

    fs.setEntrySize(e, size);
    fs.entrySetMeta(e, "size", size);
    fs.entrySetMeta(e, "files", files);
    fs.entrySetMeta(e, "dirs", dirs);
    return { size, files, dirs };
  }

  /**
   * @param {FileSysDir} fs
   * @param {Function} onDir
   * @returns {Promise}
   */
  export async function calcLineCounts(fs, onDir) {
    let root = fs.rootEntry();
    let dirsToVisit = [root];

    while (len(dirsToVisit) > 0) {
      let dirEntry = dirsToVisit.shift();
      let a = fs.entryChildren(dirEntry);
      if (onDir) {
        onDir(dirEntry);
      }
      let total = 0;
      for (let e of a) {
        let excluded = isExcluded(fs, e);
        if (excluded) {
          // TODO: for files this can be slow if we exclude and then include
          // back, because we'll have to re-read the file
          // we could have another meta prop: cachedLineCount
          setLineCount(fs, e, 0);
          continue;
        }
        let isDir = fs.entryIsDir(e);
        if (isDir) {
          dirsToVisit.push(e);
          continue;
        }
        let name = fs.entryName(e);
        let path = entryFullPath(fs, e);
        console.log("calcLineCount:", path);
        if (isBinary(name)) {
          setLineCount(fs, e, 0);
          continue;
        }
        let lc = getLineCount(fs, e);
        if (lc > 0) {
          // don't re-calculate lineCount if did it in the past
          console.log(`already have lc of ${lc} on ${path}`, lc, path);
          continue;
        }
        console.log("before fs.entryFileHandle for e:", e);
        let fh = await fs.entryFileHandle(e);
        console.log("before fh.getFile() for e:", e);
        let file = await fh.getFile();
        lc = await lineCount(file);
        console.log(`file ${path} has ${lc} lines`);
        setLineCount(fs, e, lc);
        total += lc;
      }
      // this is not recursive, just line counts of immediate
      // children
      setLineCount(fs, dirEntry, total);
    }
    console.log("calcLineCounts: finished");
  }
</script>

<script>
  import DialogConfirm from "../DialogConfirm.svelte";
  import { fmtNum, fmtSize, len } from "../util";
  import { showInfoMessage } from "../Messages.svelte";
  import { onMount } from "svelte";
  import { logWcEvent } from "../events";
  import { entryFullPath, sortEntries } from "../fs";

  /** @type {FileSysDir} */
  export let fs;
  /** @type {FsEntry} */
  export let dirRoot;
  export let indent;
  /** @type {Function} */
  export let recalc;

  let entries = [];

  onMount(() => {
    // SUBTLE: important to not re-order dirInfo.dirEntries because
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
    let dirHandle = e.parentDirHandle;
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

<!-- svelte-ignore a11y-click-events-have-key-events -->
{#each entries as e, idx}
  {@const metaDirs = fs.entryMeta(e, "dirs") || 0}
  {@const metaFiles = fs.entryMeta(e, "files") || 0}
  {@const metaLineCount = fs.entryMeta(e, "linecount") || 0}
  {@const name = fs.entryName(e)}
  {@const size = fs.entrySize(e)}
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
      <td class="pl-2 text-right">{fmtNum(getLineCount(fs, e))}</td>
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
      <svelte:self {recalc} dirInfo={e} indent={indent + 1} />
    {/if}
  {/if}
{/each}

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
