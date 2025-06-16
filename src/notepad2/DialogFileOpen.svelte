<script>
  import { onMount } from "svelte";
  import WinDialogBase from "../WinDialogBase.svelte";
  import { focus } from "../actions/focus";
  import { FsFile, fsTypeIndexedDB, getFileList } from "./FsFile";
  import { len } from "../util";

  export let open = false;
  /** @type {Function} */
  export let onDone;

  /** @type {FsFile}*/
  let selectedFile = null;

  let btnOpenDisabled = false;

  let fileList = [];

  function fileClicked(file) {
    console.log("fileClicked:", file);
    selectedFile = file;
  }

  function fileDblClicked(file) {
    console.log("fileDblClicked:", file);
    open = false;
    onDone(file);
  }

  function btnOpenClicked() {
    let file = selectedFile;
    console.log("btnOpenClicked:", file);
    if (!file) {
      return;
    }
    open = false;
    onDone(file);
  }

  function close() {
    open = false;
    onDone(null);
  }

  $: btnOpenDisabled = selectedFile == null;

  /**
   * @param {KeyboardEvent} ev
   */
  function handleKeyDown(ev) {
    if (ev.key === "Enter") {
      if (selectedFile !== null) {
        open = false;
        onDone(selectedFile);
        return;
      }
    }
  }

  onMount(async () => {
    fileList = await getFileList(fsTypeIndexedDB);
  });
</script>

<WinDialogBase onClose={close} bind:open title="Open File">
  <div
    slot="main"
    class="bg-white pt-2 pb-4 flex flex-col min-h-[4rem]"
    role="listbox"
    tabindex="0"
    on:keydown={handleKeyDown}
  >
    {#if len(fileList) > 0}
      <div class="mx-6">Select a file:</div>
      <div
        class="flex mx-4 px-2 py-2 flex-col overflow-auto border-2 mt-2 max-h-[60vh] cursor-pointer"
      >
        {#each fileList as f (f.id)}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          {#if f === selectedFile}
            <div
              class="bg-gray-100 hover:bg-gray-200"
              role="option"
              aria-selected="true"
              tabindex="0"
              on:dblclick={() => fileDblClicked(f)}
              on:click={() => fileClicked(f)}
            >
              {f.name}
            </div>
          {:else}
            <div
              class="hover:bg-gray-200"
              role="option"
              aria-selected="false"
              tabindex="0"
              on:dblclick={() => fileDblClicked(f)}
              on:click={() => fileClicked(f)}
            >
              {f.name}
            </div>
          {/if}
        {/each}
      </div>
    {:else}
      <div>There are no files to open!</div>
    {/if}
  </div>

  <!-- bottom -->
  <div slot="bottom" class="flex justify-end textselect-none">
    <button
      disabled={btnOpenDisabled}
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded-xs min-w-[5rem] bg-white hover:border-blue-500 disabled:text-gray-200 disabled:border-0 disabled:bg-white"
      on:click={btnOpenClicked}>Open</button
    >
    <button
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded-xs min-w-[5rem] bg-white hover:border-blue-500"
      use:focus
      on:click={close}>Cancel</button
    >
  </div>
</WinDialogBase>
