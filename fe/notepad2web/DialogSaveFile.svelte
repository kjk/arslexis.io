<script>
  import { getContext, onMount } from "svelte";
  import { focus } from "../actions/focus";
  import WinDialogBase from "../WinDialogBase.svelte";

  export let name = "";
  export let fileList = [];
  /** @type {Function} */
  export let handleSave;

  let fnDismissDialog = getContext("fnDismissDialog");

  function fileClicked(clickedName) {
    console.log("fileClicked:", clickedName);
    name = clickedName;
  }

  function fileDblClicked(clickedName) {
    console.log("fileDblClicked:", clickedName);
    // name = clickedName;
  }

  // TOOD: why use:focus doesn't work? It flashes briefly
</script>

<WinDialogBase title="Save As">
  <div slot="main" class="bg-white pt-2 flex flex-col min-h-[4rem]">
    <div class="mx-4">Existing files:</div>
    <div class="flex mx-4 flex-col overflow-auto border-2 mt-2 max-h-[60vh]">
      {#each fileList as f}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class="hover:bg-gray-100"
          on:dblclick={() => fileDblClicked(f)}
          on:click={() => fileClicked(f)}
        >
          {f}
        </div>
      {/each}
    </div>

    <div class="flex items-baseline mt-4 py-2 bg-gray-50 ">
      <div class="ml-4">File name:</div>
      <input
        type="text"
        class="mx-4 px-2 py-0.5 border-gray-800 border-1"
        bind:value={name}
      />
    </div>
  </div>

  <!-- bottom -->
  <div slot="bottom" class="flex justify-end text-xs select-none">
    <button
      class="ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      on:click={() => handleSave(name)}>Save</button
    >
    <button
      class="ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      on:click={fnDismissDialog}>Cancel</button
    >
  </div>
</WinDialogBase>
