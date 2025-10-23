<script lang="ts">
  import { focus } from "./actions/focus";
  import WinDialogBase from "./WinDialogBase.svelte";

  export let open = false;

  /** @type {string} */
  export let title;
  /** @type {string} */
  export let message;
  export let confirmButton = "Ok";
  export let cancelButton = "Cancel";
  /** @type {Function} */
  export let onConfirm;

  function close() {
    open = false;
  }
</script>

<WinDialogBase bind:open {title}>
  <div slot="main" class="bg-white px-2 py-8 flex justify-center">
    <div>{@html message}</div>
  </div>

  <!-- bottom -->
  <div slot="bottom" class="flex justify-end text-xs select-none">
    <button
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded-xs min-w-[5rem] bg-white hover:border-blue-500"
      on:click={() => {
        close();
        onConfirm();
      }}>{confirmButton}</button
    >
    <button
      use:focus
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded-xs min-w-[5rem] bg-white hover:border-blue-500"
      on:click={close}>{cancelButton}</button
    >
  </div>
</WinDialogBase>
