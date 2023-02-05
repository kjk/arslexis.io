<script>
  import { getContext } from "svelte";
  import { focus } from "../actions/focus";
  import WinDialogBase from "../WinDialogBase.svelte";

  export let filePath = "foo.txt";

  let fnDismissDialog = getContext("fnDismissDialog");
</script>

<WinDialogBase title="Save Changes?">
  <div class="bg-white px-2 py-8 flex justify-center" slot="main">
    <div>Save changes to '{filePath}' ?</div>
  </div>

  <!-- bottom -->
  <div slot="bottom" class="flex justify-end text-xs select-none">
    <button
      class="ml-24 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      on:click={() => {}}>Yes</button
    >
    <button
      class="ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      on:click={() => {}}>No</button
    >
    <button
      use:focus
      class="ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      on:click={fnDismissDialog}>Cancel</button
    >
  </div>
</WinDialogBase>
