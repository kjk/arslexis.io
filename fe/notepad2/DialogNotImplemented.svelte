<script>
  import WinDialogBase from "../WinDialogBase.svelte";

  export let open = false;
  export let msg = "";
</script>

<WinDialogBase bind:open title="Notepad2 web">
  <div class="bg-white px-8 py-8 flex justify-center min-h-[4rem]" slot="main">
    <div>{msg}</div>
  </div>

  <!-- bottom -->
  <div slot="bottom" class="flex justify-end text-xs select-none">
    <button
      use:focus
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      on:click={() => {
        open = false;
      }}>Ok</button
    >
  </div>
</WinDialogBase>
