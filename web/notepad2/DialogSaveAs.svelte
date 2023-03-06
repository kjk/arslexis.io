<script>
  import { onMount } from "svelte";
  import WinDialogBase from "../WinDialogBase.svelte";
  import {
    FsFile,
    fsTypeIndexedDB,
    getFileList,
    newIndexedDBFile,
  } from "./FsFile";
  import { len } from "../util";
  import { focus } from "../actions/focus";

  export let open = false;

  export let name = "";
  /** @type {Function} */
  export let onDone;

  let selectedFile = null;

  let fileList = [];

  /**
   * @param {FsFile} clickedFile
   */
  function fileClicked(clickedFile) {
    console.log("fileClicked:", clickedFile);
    selectedFile = clickedFile;
    name = clickedFile.name;
  }

  /**
   * @param {FsFile} clickedFile
   */
  function fileDblClicked(clickedFile) {
    console.log("fileDblClicked:", clickedFile);
    // name = clickedName;
  }

  function save() {
    if (selectedFile && selectedFile.name == name) {
      // if changed name since selecting,
      onDone(selectedFile);
      open = false;
      return;
    }
    if (name === "") {
      return;
    }
    let f = newIndexedDBFile(name);
    onDone(f);
    open = false;
  }

  function close() {
    open = false;
    onDone(null);
  }

  /**
   * @param {KeyboardEvent} ev
   */
  function handleInputKeyDown(ev) {
    if (ev.key === "Enter") {
      save();
    }
  }

  onMount(async () => {
    fileList = await getFileList(fsTypeIndexedDB);
  });
</script>

<WinDialogBase bind:open title="Save As">
  <div slot="main" class="bg-white pt-2 flex flex-col min-h-[4rem]">
    {#if len(fileList) > 0}
      <div class="mx-4">Existing files:</div>
      <div class="flex mx-4 flex-col overflow-auto border-2 mt-2 max-h-[60vh]">
        {#each fileList as f}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            aria-selected={selectedFile === f}
            class="aria-selected:bg-gray-50 hover:bg-gray-100 aria-selected:hover:bg-gray-100"
            on:dblclick={() => fileDblClicked(f)}
            on:click={() => fileClicked(f)}
          >
            {f.name}
          </div>
        {/each}
      </div>
    {/if}

    <div class="flex items-baseline mt-4 py-2 bg-gray-50 ">
      <div class="ml-4">File name:</div>
      <input
        type="text"
        class="mx-4 px-2 py-0.5 border-gray-800 border-1"
        use:focus
        spellcheck="false"
        autocomplete="false"
        on:keydown={handleInputKeyDown}
        bind:value={name}
      />
    </div>
  </div>

  <!-- bottom -->
  <div slot="bottom" class="flex justify-end text-xs select-none">
    <button
      disabled={name === ""}
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500 disabled:bg-gray-50 disabled:border-gray-100"
      on:click={save}>Save</button
    >
    <button
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      on:click={close}>Cancel</button
    >
  </div>
</WinDialogBase>
