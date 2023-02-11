<script>
  import { len } from "../util";
  import { delayedFocus } from "../actions/focus";
  import WinDialogBase from "../WinDialogBase.svelte";
  import {
    FsFile,
    fsTypeLocalStorage,
    getFileList,
    newLocalStorageFile,
  } from "./FsFile";

  export let open = false;

  export let name = "";
  /** @type {Function} */
  export let handleSave;

  let fileList = getFileList(fsTypeLocalStorage);

  function fileClicked(clickedName) {
    console.log("fileClicked:", clickedName);
    name = clickedName;
  }

  function fileDblClicked(clickedName) {
    console.log("fileDblClicked:", clickedName);
    // name = clickedName;
  }

  function saveMe(name) {
    open = false;
    let f = newLocalStorageFile(name);
    handleSave(f);
  }

  /**
   * @param {KeyboardEvent} ev
   */
  function handleInputKeyDown(ev) {
    if (ev.key === "Enter") {
      if (name !== "") {
        saveMe(name);
      }
    }
  }
</script>

<WinDialogBase bind:open title="Save As">
  <div slot="main" class="bg-white pt-2 flex flex-col min-h-[4rem]">
    {#if len(fileList) > 0}
      <div class="mx-4">Existing files:</div>
      <div class="flex mx-4 flex-col overflow-auto border-2 mt-2 max-h-[60vh]">
        {#each fileList as f}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class="hover:bg-gray-100"
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
        use:delayedFocus
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
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      on:click={() => {
        saveMe(name);
      }}>Save</button
    >
    <button
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      on:click={() => {
        open = false;
      }}>Cancel</button
    >
  </div>
</WinDialogBase>
