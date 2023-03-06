<script context="module">
  /**
   * @typedef { Object } Entry
   * @property {string} name
   * @property {FsFile} [file]
   * @property {Function} open
   */
</script>

<script>
  import { onMount } from "svelte";
  import WinDialogBaseNoOverlay from "../WinDialogBaseNoOverlay.svelte";
  import { focus } from "../actions/focus";
  import { FsFile, fsTypeIndexedDB, getFileList } from "./FsFile";
  import { len } from "../util";

  export let open = false;
  /** @type {Function} */
  export let onDone;

  /** @type {Entry}*/
  let selected = null;

  let btnOpenDisabled = false;

  /** @type {Entry[]} */
  let entries = [];

  /**
   * @param {Entry} e
   */
  async function entryClicked(e) {
    console.log("entryClicked:", e);
    selected = e;
  }

  /**
   * @param {Entry} e
   */
  async function entryDblClicked(e) {
    console.log("entryDblClicked:", e);
    await e.open(e);
  }

  async function btnOpenClicked() {
    let e = selected;
    console.log("btnOpenClicked:", e);
    if (!e) {
      return;
    }
    await e.open(e);
  }

  function close() {
    open = false;
    onDone(null);
  }

  $: btnOpenDisabled = selected == null || !selected.file;

  /**
   * @param {Entry} e
   */
  async function setTopLevel(e) {
    console.log();
    /** @type {Entry} */
    const e1 = {
      name: "browser",
      open: browserOpen,
    };
    entries = [e1];
  }

  /**
   * @param {Entry} e
   */
  async function browserOpenFile(e) {
    open = false;
    onDone(e.file);
  }

  /**
   * @param {Entry} e
   */
  async function browserOpen(e) {
    /** @type {Entry} */
    let e1 = {
      name: "..",
      open: setTopLevel,
    };
    let a = [e1];
    const files = await getFileList(fsTypeIndexedDB);
    for (const f of files) {
      /** @type {Entry} */
      const e = {
        name: f.name,
        file: f,
        open: browserOpenFile,
      };
      a.push(e);
    }
    entries = a;
  }

  onMount(async () => {
    await setTopLevel(null);
  });
</script>

<WinDialogBaseNoOverlay bind:open title="Browse Files">
  <div
    class="flex mx-4 px-2 py-2 flex-col overflow-auto border-2 my-2 min-h-[12rem] max-h-[60vh] cursor-pointer select-none"
    tabindex="0"
    slot="main"
    role="listbox"
  >
    {#each entries as f}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      {#if f === selected}
        <div
          class="bg-gray-100 hover:bg-gray-200"
          on:dblclick={() => entryDblClicked(f)}
          on:click={() => entryClicked(f)}
        >
          {f.name}
        </div>
      {:else}
        <div
          class="hover:bg-gray-200"
          on:dblclick={() => entryDblClicked(f)}
          on:click={() => entryClicked(f)}
        >
          {f.name}
        </div>
      {/if}
    {/each}
  </div>

  <!-- bottom -->
  <div slot="bottom" class="flex justify-end textselect-none">
    <button
      disabled={btnOpenDisabled}
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500 disabled:text-gray-200 disabled:border-0 disabled:bg-white"
      on:click={btnOpenClicked}>Open</button
    >
    <button
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      use:focus
      on:click={close}>Cancel</button
    >
  </div>
</WinDialogBaseNoOverlay>
