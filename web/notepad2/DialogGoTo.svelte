<script>
  import { len } from "../util";
  import WinDialogBase from "../WinDialogBase.svelte";

  // TODO:
  // - allow enter, tab as entered chars
  // - shift-tab to navigate between fields?

  export let open = false;

  export let lineNo = "1";
  export let maxLine;
  export let colNo = undefined;
  /** @type {Function} */
  export let onDone;

  let canDispatch = false;
  $: canDispatch = validLine(lineNo);

  function validLine(lineNo) {
    const l = +lineNo;
    return l >= 1 && l <= maxLine;
  }
  function dispatchOk() {
    if (canDispatch) {
      open = false;
      onDone(+lineNo, +colNo || 1);
    }
  }

  /**
   * @param {KeyboardEvent} ev
   */
  function handleInputKeyDown(ev) {
    console.log("DialogGoTo: handleInputKeyDown:", ev);
    // we want the user to be able to input enter
    if (ev.key === "Enter") {
      dispatchOk();
    }
  }

  /**
   * @param {HTMLInputElement} node
   */
  function focusAndSetCursor(node) {
    console.log("focusAndSetCursor");
    node.focus();
  }

  function close() {
    open = false;
    onDone(null, null);
  }
</script>

<WinDialogBase onDone={close} bind:open title="GoTo">
  <div
    slot="main"
    class="bg-white pt-2 pb-2 pl-4 pr-4 flex flex-col min-h-[4rem]"
  >
    <div>Line (empty or 1 - {maxLine}):</div>
    <input
      type="number"
      class="px-2 py-0.5 border-gray-300 border focus-within:outline-blue-500/50"
      use:focusAndSetCursor
      spellcheck="false"
      autocomplete="false"
      on:keydown={handleInputKeyDown}
      bind:value={lineNo}
    />
    <div>Column (empty or 1-17.384):</div>
    <input
      type="number"
      class="px-2 py-0.5 border-gray-300 border focus-within:outline-blue-500/50"
      spellcheck="false"
      autocomplete="false"
      on:keydown={handleInputKeyDown}
      bind:value={colNo}
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
      on:click={close}>Cancel</button
    >
  </div>
</WinDialogBase>
