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
   * @param {FileSys} fs
   * @param {FsEntry[]} entries
   */
  export function sortEntries(fs, entries) {
    /**
     * @param {FsEntry} e1
     * @param {FsEntry} e2
     */
    function sortFn(e1, e2) {
      let e1Dir = fs.entryIsDir(e1);
      let e2Dir = fs.entryIsDir(e2);
      let name1 = fs.entryName(e1);
      let name2 = fs.entryName(e1);
      if (e1Dir && e2Dir) {
        return strCompareNoCase(name1, name2);
      }
      if (e1Dir || e2Dir) {
        return e1Dir ? -1 : 1;
      }
      return strCompareNoCase(name1, name2);
    }
    entries.sort(sortFn);
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
   * @param {FsEntry} e
   * @param {Function} onDir
   * @returns {Promise<number>}
   */
  export async function calcLineCounts(fs, e, onDir) {
    let total = 0;
    let a = fs.entryChildren(e);
    if (onDir) {
      onDir(e);
    }
    for (let e of a) {
      let excluded = isExcluded(fs, e);
      if (excluded) {
        // TODO: for files this can be slow if we exclude and then include
        // back, because we'll have to re-read the file
        // we could have another meta prop: cachedLineCount
        setLineCount(fs, e, 0);
        continue;
      }
      let path = entryFullPath(fs, e);
      let isDir = fs.entryIsDir(e);
      if (isDir) {
        total += await calcLineCounts(fs, e, onDir);
      } else {
        let lc = getLineCount(fs, e);
        // don't re-calculate lineCount if did it in the past
        if (!isBinary(path) && lc == 0) {
          let fh = await fs.entryFileHandle(e);
          let file = await fh.getFile();
          lc = await lineCount(file);
        }
        total += lc;
        setLineCount(fs, e, lc);
      }
    }
    setLineCount(fs, e, total);
    return total;
  }
</script>

<script>
  import DialogConfirm from "../DialogConfirm.svelte";
  import { fmtNum, fmtSize, len } from "../util";
  import { showInfoMessage } from "../Messages.svelte";
  import { onMount } from "svelte";
  import { logWcEvent } from "../events";
  import { entryFullPath, entryPath } from "../fs";

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
  function toggleExpand(e) {
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
    let name = e.name;
    let opts;
    if (e.isDir) {
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

    let evt = e.isDir ? "deleteFolder" : "deleteFile";
    logWcEvent(evt);
  }

  function deleteDirOrFile(idx) {
    let e = entries[idx];
    // console.log("deleteDirOrFile: idx:", idx, "e:", e);
    let name = e.name;
    toDeleteIdx = idx;
    let what = e.isDir ? "directory" : "file";
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
  {@const meta = e.meta}
  {@const excluded = isExcluded(fs, e)}
  {#if e.isDir}
    <tr
      on:click={() => toggleExpand(e)}
      class="hover:bg-gray-200 hover:cursor-pointer pl-8"
    >
      <td class="ind-{indent} font-semibold">
        {#if isExpanded(fs, e)}
          ▼
        {:else}
          ▶
        {/if}
        {e.name}
      </td>
      <td class="pl-2 text-right whitespace-nowrap">
        {fmtSize(e.size)}
      </td>
      <td class="pl-2 text-right">{fmtNum(meta.dirs)}</td>
      <td class="pl-2 text-right">{fmtNum(meta.files)}</td>
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
  {@const excluded = isExcluded(fs, e)}
  {#if !e.isDir}
    <tr class="hover:bg-gray-200 even:bg-gray-50">
      <td class="ind-{indent + 1}">{e.name} </td>
      <td class="pl-2 text-right whitespace-nowrap">{fmtSize(e.size)} </td>
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
