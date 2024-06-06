<script context="module">
  /** @typedef {import("./np2store").FavEntry} FavEntry */
</script>

<script>
  import { onMount } from "svelte";
  import WinDialogBase from "../WinDialogBase.svelte";
  import { focus } from "../actions/focus";
  import { recent, favorites } from "./np2store";
  import { arrayRemove, len, throwIf } from "../util";

  export let open = false;
  /** @type {Function} */
  export let onDone;

  /* "favorites", "recent" */
  export let type;
  export let rememberRecentFiles;

  let title;
  let emptyMsg;

  /** @type {FavEntry[]} */
  let entries;

  /** @type {FavEntry} */
  let selected = null;

  let btnOpenDisabled = false;
  let btnDeleteDisabled = false;

  function clicked(fav) {
    selected = fav;
  }

  function dblClicked(fav) {
    open = false;
    onDone(fav);
  }

  function openClicked() {
    let fav = selected;
    if (!fav) {
      return;
    }
    open = false;
    onDone(fav);
  }

  async function removeFav() {
    switch (type) {
      case "recent":
        $recent = arrayRemove($recent, selected);
        entries = $recent;
        break;
      case "favorites":
        $favorites = arrayRemove($favorites, selected);
        entries = $favorites;
        break;
    }
  }

  function close() {
    open = false;
    onDone(null);
  }

  $: btnDeleteDisabled = btnOpenDisabled = selected == null;

  /**
   * @param {KeyboardEvent} ev
   */
  function handleKeyDown(ev) {
    if (ev.key === "Enter") {
      if (selected !== null) {
        open = false;
        onDone(selected);
        return;
      }
    }
  }

  onMount(async () => {
    switch (type) {
      case "recent":
        title = "Open Recent File";
        emptyMsg = "no recent files!";
        entries = $recent;
        break;
      case "favorites":
        title = "Favorites";
        emptyMsg = "no favorites!";
        entries = $favorites;
        break;
      default:
        throwIf(true, `unknown type '${type}'`);
    }
  });

  async function clearHistory() {
    $recent = [];
    entries = $recent;
  }
</script>

<WinDialogBase onClose={close} bind:open {title}>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    slot="main"
    class="bg-white pt-2 pb-4 flex flex-col min-h-[4rem]"
    on:keydown={handleKeyDown}
  >
    <div
      class="flex mx-4 px-2 py-2 flex-col overflow-auto border-2 mt-2 cursor-pointer min-h-[12rem] max-h-[8rem] select-none"
      tabindex="0"
      role="listbox"
    >
      {#if len(entries) === 0}
        <div class="mx-auto my-auto">{emptyMsg}</div>
      {:else}
        {#each entries as f (f.id)}
          {#if f === selected}
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
              class="bg-gray-100 hover:bg-gray-200"
              on:dblclick={() => dblClicked(f)}
              on:click={() => clicked(f)}
            >
              {f.name}
            </div>
          {:else}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
              class="hover:bg-gray-200"
              on:dblclick={() => dblClicked(f)}
              on:click={() => clicked(f)}
            >
              {f.name}
            </div>
          {/if}
        {/each}
      {/if}
    </div>
    {#if type === "recent"}
      <div class="flex justify-between mx-5 mt-2 text-xs">
        <label
          ><input type="checkbox" bind:checked={rememberRecentFiles} />Remeber
          recent files
        </label>
        <button class="underline text-blue-500" on:click={clearHistory}
          >Clear History</button
        >
      </div>
    {/if}
  </div>

  <!-- bottom -->
  <div slot="bottom" class="flex textselect-none">
    <button
      disabled={btnDeleteDisabled}
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500 disabled:text-gray-200 disabled:border-0 disabled:bg-white"
      on:click={removeFav}>Remove</button
    >
    <div class="grow"></div>
    <button
      disabled={btnOpenDisabled}
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500 disabled:text-gray-200 disabled:border-0 disabled:bg-white"
      on:click={openClicked}>Open</button
    >
    <button
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      use:focus
      on:click={close}>Cancel</button
    >
  </div>
</WinDialogBase>

<style>
  label {
    display: inline-block;
    white-space: nowrap;
  }
  input {
    vertical-align: middle;
    margin-top: -3px;
    margin-right: 4px;
  }
</style>
