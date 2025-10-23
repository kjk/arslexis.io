<svelte:options runes={true} />

<script module>
  import type { FsEntry, FileSys } from "../fs";
  import { sortEntries } from "../fs";

  export function isExpanded(fs: FileSys, e: FsEntry): boolean {
    return fs.entryMeta(e, "expanded") || false;
  }

  export function setExpanded(fs: FileSys, e: FsEntry, expanded: boolean) {
    fs.entrySetMeta(e, "expanded", expanded);
  }
</script>

<script lang="ts">
  import Folder from "./Folder.svelte";
  import { fmtNum, fmtSize, len, throwIf } from "../util";
  import { tick } from "svelte";

  type Props = {
    fs: FileSys;
    dirRoot: FsEntry;
    isRoot?: boolean;
    indent: number;
    recalc: Function;
    onSelected: Function;
    onGoUp: Function;
    initialSelectionIdx?: number;
  };

  let {
    fs,
    dirRoot,
    isRoot = false,
    indent,
    recalc,
    onSelected,
    onGoUp,
    initialSelectionIdx = 0,
  }: Props = $props();

  let selectedIdx = $state(0);
  let tbodyEl: HTMLElement;
  let noFilesEl: HTMLElement | null = $state(null);

  let entries: FsEntry[] = $derived(calcEntries(dirRoot));

  let forceRender = $state(0);

  function calcEntries(dirRoot: FsEntry): FsEntry[] {
    // console.log("calcEntries");
    // SUBTLE: important to not re-order  because
    // they could be used in calcLineCount()
    // we use and sort a copy
    let c = fs.entryChildren(dirRoot);
    let res: FsEntry[] = [].concat(c);
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

  function toggleExpand(e: FsEntry) {
    console.log("toggleExpand", e);
    let expanded = isExpanded(fs, e);
    setExpanded(fs, e, !expanded);
    forceRender++;
  }

  function fmtDirs(e: FsEntry): string {
    let isDir = fs.entryIsDir(e);
    throwIf(!isDir);
    let nDirs = fs.entryDirCount(e);
    return "D: " + fmtNum(nDirs);
  }

  function fmtFiles(e: FsEntry): string {
    let isDir = fs.entryIsDir(e);
    throwIf(!isDir);
    let nFiles = fs.entryFileCount(e);
    return "F: " + fmtNum(nFiles);
  }

  function fmtEntrySize(e: FsEntry): string {
    let size = fs.entrySize(e);
    // console.log("e:", e, "size:", size);
    let s = fmtSize(size);
    return s;
  }

  function findClickedIdx(el: HTMLElement): number {
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

  function handleDoubleClicked(e: MouseEvent) {
    let el = e.target as HTMLElement;
    let idx = findClickedIdx(el);
    let entry = entries[idx];
    let isDir = fs.entryIsDir(entry);
    if (isDir) {
      onSelected(entry, idx);
    }
  }

  function handleClicked(e: MouseEvent) {
    let el = e.target as HTMLElement;
    let idx = findClickedIdx(el);
    setSelected(idx);
    return;
  }

  function handleKeyDown(e: KeyboardEvent) {
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

  function setSelected(idx: number) {
    let nItems = len(entries);
    if (idx < 0 || idx >= nItems) {
      return;
    }
    selectedIdx = idx;
    let q = `[data-idx="${idx}"]`;
    let el = tbodyEl.querySelector(q) as HTMLElement;
    el.focus();
  }
</script>

{#snippet emptyState()}
  {#if len(entries) == 0}
    <tr
      bind:this={noFilesEl}
      tabindex="0"
      class="hover:bg-gray-200 hover:cursor-pointer border"
    >
      <td class="text-center py-10">No files</td>
    </tr>
  {/if}
{/snippet}

{#snippet dir(fs, e, idx)}
  <tr
    data-idx={idx}
    tabindex="0"
    class="hover:bg-gray-200 hover:cursor-pointer w-full"
  >
    <td class="ind-{indent} font-semibold">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span onclick={() => toggleExpand(e)} class="hover:bg-gray-300">
        {#if isExpanded(fs, e)}
          ▼
        {:else}
          ▶
        {/if}
      </span>
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
{/snippet}

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<table
  class="font-mono text-sm mt-[2px] w-full table-auto border-collapse"
  onclick={handleClicked}
  ondblclick={handleDoubleClicked}
  onkeydown={handleKeyDown}
>
  <tbody bind:this={tbodyEl}>
    {#key forceRender}
      {@render emptyState()}
      {#each entries as e, idx}
        {#if fs.entryIsDir(e)}
          {@render dir(fs, e, idx)}
          {#if isExpanded(fs, e)}
            <Folder
              {fs}
              dirRoot={e}
              indent={indent + 1}
              {recalc}
              {onSelected}
              {onGoUp}
            />
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
    {/key}
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
    background-color: var(--color-blue-100); /* bg-blue-100 */
  }
</style>
