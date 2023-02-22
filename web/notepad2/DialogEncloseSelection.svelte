<script>
  import { len } from "../util";
  import { focus } from "../actions/focus";
  import WinDialogBase from "../WinDialogBase.svelte";

  // TODO:
  // - allow enter, tab as entered chars
  // - shift-tab to navigate between fields?

  export let open = false;

  export let before = "";
  export let after = "";
  /** @type {Function} */
  export let handleOk;

  let canDispatch = false;
  $: canDispatch = len(before) + len(after) > 0;

  function dispatchOk() {
    if (canDispatch) {
      handleOk(before, after);
      open = false;
    }
  }

  /**
   * @param {KeyboardEvent} ev
   */
  function handleInputKeyDown(ev) {
    // we want the user to be able to input enter
    if (ev.key === "Enter" && ev.ctrlKey) {
      dispatchOk();
    }
  }
</script>

<WinDialogBase bind:open title="Enclose Selection">
  <div
    slot="main"
    class="bg-white pt-2 pb-2 pl-4 pr-4 flex flex-col min-h-[4rem]"
  >
    <div>Insert before selection:</div>
    <input
      type="text"
      class="px-2 py-0.5 border-gray-300 border focus-within:outline-blue-500/50"
      use:focus
      spellcheck="false"
      autocomplete="false"
      on:keydown={handleInputKeyDown}
      bind:value={before}
    />
    <div>Insert after selection:</div>
    <input
      type="text"
      class="px-2 py-0.5 border-gray-300 border focus-within:outline-blue-500/50"
      spellcheck="false"
      autocomplete="false"
      on:keydown={handleInputKeyDown}
      bind:value={after}
    />
  </div>

  <!-- bottom -->
  <div slot="bottom" class="flex justify-end text-xs select-none">
    <button
      disabled={!canDispatch}
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500 disabled:bg-gray-50 disabled:border-gray-100"
      on:click={dispatchOk}>Ok</button
    >
    <button
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      on:click={() => {
        open = false;
      }}>Cancel</button
    >
  </div>
</WinDialogBase>
