<svelte:options runes={true} />

<script context="module">
  import { sortEntries } from "../fs";
  /** @typedef {import("../fs").FsEntry} FsEntry */
  /** @typedef {import("../fs").FileSys} FileSys */

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
</script>

<script>
  import { fmtNum, fmtSize, len, throwIf } from "../util";
  import { tick } from "svelte";

  /** @type { {
   fs: FileSys,
   dirRoot: FsEntry,
   isRoot: boolean,
   indent: number,
   recalc: Function,
   onSelected: Function,
   onGoUp: Function,
   initialSelectionIdx: number,
  }}*/
  let {
    fs,
    dirRoot,
    isRoot = false,
    indent,
    recalc,
    onSelected,
    onGoUp,
    initialSelectionIdx = 0,
  } = $props();

  let selectedIdx = $state(0);
  /** @type {HTMLElement} */
  let tbodyEl;
  /** @type {HTMLElement} */
  let noFilesEl = $state(null);

  /** @type {FsEntry[]} */
  let entries = $derived(calcEntries(dirRoot));

  /**
   * @param {FsEntry} dirRoot
   * @return {FsEntry[]}
   */
  function calcEntries(dirRoot) {
    // console.log("calcEntries");
    // SUBTLE: important to not re-order  because
    // they could be used in calcLineCount()
    // we use and sort a copy
    let c = fs.entryChildren(dirRoot);
    /** @type {FsEntry[]} */
    let res = [].concat(c);
    sortEntries(fs, res);
    if (!isRoot) {
      // TODO: restore ".."
      // let e = new FsEntryUpDir();
      // entries.unshift(e);
    }
    if (len(res) > 0) {
      tick().then(() => {
        setSelected(initialSelectionIdx);
      });
    } else {
      tick().then(() => {
        noFilesEl.focus();
      });
    }
    return res;
  }

  /**
   * @param {FsEntry} e
   */
  function toggleExpand(e) {
    let expanded = isExpanded(fs, e);
    setExpanded(fs, e, !expanded);
    // entries = entries;
  }

  /**
   * @param {FsEntry} e
   * @returns {string}
   */
  function fmtDirs(e) {
    let isDir = fs.entryIsDir(e);
    throwIf(!isDir);
    let nDirs = fs.entryDirCount(e);
    return "D: " + fmtNum(nDirs);
  }

  /**
   * @param {FsEntry} e
   * @returns {string}
   */
  function fmtFiles(e) {
    let isDir = fs.entryIsDir(e);
    throwIf(!isDir);
    let nFiles = fs.entryFileCount(e);
    return "F: " + fmtNum(nFiles);
  }

  /**
   * @param {FsEntry} e
   * @returns {string}
   */
  function fmtEntrySize(e) {
    let size = fs.entrySize(e);
    // console.log("e:", e, "size:", size);
    let s = fmtSize(size);
    return s;
  }

  /**
   * @param {HTMLElement} el
   * @returns {number}
   */
  function findClickedIdx(el) {
    while (el) {
      let idxStr = el.getAttribute("data-idx");
      if (idxStr) {
        let idx = parseInt(idxStr);
        // console.log("idx:", idx);
        return idx;
      }
      el = el.parentElement;
    }
    return -1;
  }

  /**
   * @param {MouseEvent} e
   */
  function handleDoubleClicked(e) {
    let el = /** @type {HTMLElement} */ (e.target);
    let idx = findClickedIdx(el);
    let entry = entries[idx];
    let isDir = fs.entryIsDir(entry);
    if (isDir) {
      onSelected(entry, idx);
    }
  }

  /**
   * @param {MouseEvent} e
   */
  function handleClicked(e) {
    let el = /** @type {HTMLElement} */ (e.target);
    let idx = findClickedIdx(el);
    setSelected(idx);
    return;
  }

  /**
   * @param {KeyboardEvent} e
   */
  function handleKeyDown(e) {
    let nItems = len(entries);
    let key = e.key;

    if (key === "Backspace" || key === "ArrowLeft") {
      e.stopPropagation();
      e.preventDefault();
      onGoUp();
      return;
    }

    if (key === "Enter" || key === "ArrowRight") {
      e.stopPropagation();
      e.preventDefault();
      let idx = selectedIdx;
      let entry = entries[idx];
      let isDir = fs.entryIsDir(entry);
      if (isDir) {
        onSelected(entry, idx);
      }
      return;
    }

    if (key === "ArrowUp") {
      e.stopPropagation();
      e.preventDefault();
      let idx = selectedIdx - 1;
      if (idx < 0) {
        return;
      }
      setSelected(idx);
      return;
    }

    if (key === "ArrowDown") {
      e.stopPropagation();
      e.preventDefault();
      let idx = selectedIdx + 1;
      if (idx >= nItems) {
        return;
      }
      setSelected(idx);
      return;
    }
  }

  /**
   * @param {number} idx
   */
  function setSelected(idx) {
    let nItems = len(entries);
    if (idx < 0 || idx >= nItems) {
      return;
    }
    selectedIdx = idx;
    let q = `[data-idx="${idx}"]`;
    let el = /** @type {HTMLElement} */ (tbodyEl.querySelector(q));
    el.focus();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<table
  class="font-mono text-sm mt-[2px] w-full table-auto border-collapse"
  onclick={handleClicked}
  ondblclick={handleDoubleClicked}
  onkeydown={handleKeyDown}
>
  <tbody bind:this={tbodyEl}>
    {#if len(entries) == 0}
      <tr
        bind:this={noFilesEl}
        tabindex="0"
        class="hover:bg-gray-200 hover:cursor-pointer border"
      >
        <td class="text-center py-10">No files</td>
      </tr>{/if}
    {#each entries as e, idx}
      {#if fs.entryIsDir(e)}
        <tr
          data-idx={idx}
          tabindex="0"
          class="hover:bg-gray-200 hover:cursor-pointer w-full"
        >
          <td class="ind-{indent} font-semibold">
            {#if isExpanded(fs, e)}
              ▼
            {:else}
              ▶
            {/if}
            {fs.entryName(e)}
          </td>
          <td class="pl-2 text-right whitespace-nowrap w-auto">
            {fmtDirs(e)}
          </td>
          <td class="pl-2 text-right whitespace-nowrap w-auto">
            {fmtFiles(e)}
          </td>
          <td class="pl-2 text-right whitespace-nowrap w-auto">
            {fmtEntrySize(e)}
          </td>
        </tr>
        {#if isExpanded(fs, e)}
          <svelte:self {recalc} dirRoot={e} indent={indent + 1} />
        {/if}
      {/if}
    {/each}

    {#each entries as e, idx (idx)}
      {#if !fs.entryIsDir(e)}
        <tr
          data-idx={idx}
          tabindex="0"
          class="hover:bg-gray-200 even:bg-gray-50"
        >
          <td class="ind-{indent + 1}">{fs.entryName(e)} </td>
          <td colspan="3" class="pl-2 text-right whitespace-nowrap"
            >{fmtEntrySize(e)}
          </td>
        </tr>
      {/if}
    {/each}
  </tbody>
</table>

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

  tr:focus {
    @apply bg-blue-100;
  }
</style>
