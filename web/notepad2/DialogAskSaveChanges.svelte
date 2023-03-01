<script>
  import { focus } from "../actions/focus";
  import WinDialogBase from "../WinDialogBase.svelte";

  export let open = false;
  export let name;
  /** @type {Function} */
  export let onDone;

  function close(why) {
    open = false;
    onDone(why);
  }
</script>

<WinDialogBase bind:open title="Save Changes?">
  <div slot="main" class="bg-white px-2 py-8 flex justify-center">
    <div>Save changes to <b>'{name}'</b> ?</div>
  </div>

  <!-- bottom -->
  <div slot="bottom" class="flex justify-end text-xs select-none">
    <button
      class="btn-dlg ml-24 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      on:click={() => {
        close("yes");
      }}>Yes</button
    >
    <button
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      on:click={() => {
        close("no");
      }}>No</button
    >
    <button
      use:focus
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      on:click={() => {
        close("cancel");
      }}>Cancel</button
    >
  </div>
</WinDialogBase>

<style>
</style>
