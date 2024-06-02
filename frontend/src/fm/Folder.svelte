<script context="module">
  import { FsEntryUpDir } from "../fileutil";
  import { strCompareNoCase } from "../strutil";
  /** @typedef {import("../fileutil").FsEntry} FsEntry */

  /**
   * @param {FsEntry} e
   * @returns {boolean}
   */
  export function isExpanded(e) {
    return e.getMeta("expanded");
  }

  /**
   * @param {FsEntry} e
   * @param {boolean} expanded
   */
  export function setExpanded(e, expanded) {
    e.setMeta("expanded", expanded);
  }

  /**
   * @param {FsEntry[]} entries
   */
  export function sortEntries(entries) {
    /**
     * @param {FsEntry} e1
     * @param {FsEntry} e2
     */
    function sortFn(e1, e2) {
      let e1Dir = e1.isDir;
      let e2Dir = e2.isDir;
      let name1 = e1.name;
      let name2 = e2.name;
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
   * @param {FsEntry} dirInfo
   */
  export function calcDirSizes(dirInfo) {
    let size = 0;
    let files = 0;
    let dirs = 0;
    let entries = dirInfo.dirEntries;
    for (let e of entries) {
      if (e.isDir) {
        dirs++;
        let sizes = calcDirSizes(e);
        size += sizes.size;
        files += sizes.files;
        dirs += sizes.dirs;
      } else {
        files++;
        size += e.size;
      }
    }
    dirInfo.size = size;
    dirInfo.setMeta("size", size);
    dirInfo.setMeta("files", files);
    dirInfo.setMeta("dirs", dirs);
    return { size, files, dirs };
  }
</script>

<script>
  import { fmtNum, fmtSize, len } from "../util";
  import { tick } from "svelte";

  /** @type {FsEntry} */
  export let dirRoot;
  export let isRoot = false;
  export let indent;
  /** @type {Function} */
  export let recalc;
  /** @type {Function} */
  export let onSelected;
  /** @type {Function} */
  export let onGoUp;

  /** @type {FsEntry[]} */
  let entries = [];
  $: calcEntries(dirRoot);

  function calcEntries(dirRoot) {
    console.log("calcEntries");
    // SUBTLE: important to not re-order dirInfo.dirEntries because
    // they could be used in calcLineCount()
    // we use and sort a copy
    /** @type {FsEntry[]} */
    entries = [].concat(dirRoot.dirEntries);
    sortEntries(entries);
    if (!isRoot) {
      let e = new FsEntryUpDir();
      entries.unshift(e);
    }
    if (len(entries) > 0) {
      tick().then(() => {
        setSelected(0);
      });
    }
  }

  /**
   * @param {FsEntry} e
   */
  function toggleExpand(e) {
    let expanded = isExpanded(e);
    setExpanded(e, !expanded);
    entries = entries;
  }

  /**
   * @param {FsEntry} e
   * @returns {string}
   */
  function fmtEntrySize(e) {
    let s = fmtSize(e.size);
    if (!e.isDir) {
      return s;
    }
    let meta = e.meta;
    let s2 = "D: " + fmtNum(meta.dirs);
    s2 += " F: " + fmtNum(meta.files);
    return s2 + " " + s;
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
    if (entry.isDir) {
      onSelected(entry);
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
      if (entry.isDir) {
        onSelected(entry);
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

  let selectedIdx = 0;

  /** @type {HTMLElement} */
  let tbodyEl;

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

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<table
  class="font-mono text-sm mt-[2px] w-full"
  on:click={handleClicked}
  on:dblclick={handleDoubleClicked}
  on:keydown={handleKeyDown}
>
  <tbody bind:this={tbodyEl}>
    {#each entries as e, idx}
      {#if e.isDir}
        <tr
          data-idx={idx}
          tabindex="0"
          class="hover:bg-gray-200 hover:cursor-pointer"
        >
          <td class="ind-{indent} font-semibold">
            {#if isExpanded(e)}
              ▼
            {:else}
              ▶
            {/if}
            {e.name}
          </td>
          <td class="pl-2 text-right whitespace-nowrap">
            {fmtEntrySize(e)}
          </td>
        </tr>
        {#if isExpanded(e)}
          <svelte:self {recalc} dirRoot={e} indent={indent + 1} />
        {/if}
      {/if}
    {/each}

    {#each entries as e, idx (idx)}
      {#if !e.isDir}
        <tr
          data-idx={idx}
          tabindex="0"
          class="hover:bg-gray-200 even:bg-gray-50"
        >
          <td class="ind-{indent + 1}">{e.name} </td>
          <td class="pl-2 text-right whitespace-nowrap">{fmtEntrySize(e)} </td>
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
