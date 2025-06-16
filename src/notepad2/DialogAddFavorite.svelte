<script>
  import { len } from "../util";
  import WinDialogBase from "../WinDialogBase.svelte";

  export let open = false;

  export let name;
  /** @type {Function} */
  export let onDone;

  let canDispatch = false;
  $: canDispatch = len(name) > 0;

  function dispatchOk() {
    if (canDispatch) {
      open = false;
      onDone(name);
    }
  }

  /**
   * @param {KeyboardEvent} ev
   */
  function handleInputKeyDown(ev) {
    // we want the user to be able to input enter
    if (ev.key === "Enter") {
      dispatchOk();
    }
  }

  /**
   * @param {HTMLInputElement} node
   */
  function focusAndSetCursor(node) {
    node.focus();
    node.setSelectionRange(0, len(name));
  }

  function close() {
    open = false;
    onDone(null, null);
  }
</script>

<WinDialogBase onClose={close} bind:open title="Add to Favorites">
  <div
    slot="main"
    class="bg-white pt-2 pb-2 pl-4 pr-4 flex flex-col min-h-[4rem]"
  >
    <div>Enter the name for the new favorites item:</div>
    <input
      type="text"
      class="px-2 py-0.5 border-gray-300 border focus-within:outline-blue-500/50"
      use:focusAndSetCursor
      spellcheck="false"
      autocomplete="off"
      on:keydown={handleInputKeyDown}
      bind:value={name}
    />
  </div>

  <!-- bottom -->
  <div slot="bottom" class="flex justify-end text-xs select-none">
    <button
      disabled={!canDispatch}
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded-xs min-w-[5rem] bg-white hover:border-blue-500 disabled:bg-gray-50 disabled:border-gray-100"
      on:click={dispatchOk}>Ok</button
    >
    <button
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded-xs min-w-[5rem] bg-white hover:border-blue-500"
      on:click={close}>Cancel</button
    >
  </div>
</WinDialogBase>
