<script lang="ts">
  import { len } from "../util";
  import WinDialogBase from "../WinDialogBase.svelte";

  // TODO:
  // - allow enter, tab as entered chars
  // - shift-tab to navigate between fields?

  export let open = false;

  export let before = "<>";
  export let after = "";
  /** @type {Function} */
  export let onDone;

  let canDispatch = false;
  $: canDispatch = len(before) + len(after) > 0;
  $: after = convertTag(before);

  /**
   * @param {string} s
   * @returns {string}
   */
  function convertTag(s) {
    if (!s.startsWith("<")) {
      return "";
    }
    if (!s.endsWith(">")) {
      return "";
    }
    let end = s.indexOf(" ");
    if (end < 1) {
      end = len(s) - 1;
    }
    return "</" + s.slice(1, end) + ">";
  }

  function dispatchOk() {
    if (canDispatch) {
      open = false;
      onDone(before, after);
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

  /**
   * @param {HTMLInputElement} node
   */
  function focusAndSetCursor(node) {
    console.log("focusAndSetCursor");
    node.focus();
    node.setSelectionRange(1, 1);
  }

  function close() {
    open = false;
    onDone(null, null);
  }
</script>

<WinDialogBase onClose={close} bind:open title="Enclose Selection">
  <div
    slot="main"
    class="bg-white pt-2 pb-2 pl-4 pr-4 flex flex-col min-h-[4rem]"
  >
    <div>Opening tag (with attributes):</div>
    <input
      type="text"
      class="px-2 py-0.5 border-gray-300 border focus-within:outline-blue-500/50"
      use:focusAndSetCursor
      spellcheck="false"
      autocomplete="off"
      on:keydown={handleInputKeyDown}
      bind:value={before}
    />
    <div>Closing tag (can be edited):</div>
    <input
      type="text"
      class="px-2 py-0.5 border-gray-300 border focus-within:outline-blue-500/50"
      spellcheck="false"
      autocomplete="off"
      on:keydown={handleInputKeyDown}
      bind:value={after}
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
