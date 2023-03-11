<script>
  import Close from "./icons/Close.svelte";
  import { draggable } from "@neodrag/svelte";
  import { onDestroy } from "svelte";
  import { trapFocus } from "./util";
  import { positionModal } from "./actions/positionnode";

  // based on:
  // https://svelte.dev/examples/modal

  export let title = "";
  export let open = false;
  export let onClose = null;
  export let noButtons = false;
  export let closeOnEsc = true;

  let modal = null;
  let dragHandle = null;

  function close() {
    open = false;
    if (onClose) {
      onClose();
    }
  }

  /**
   * @param {KeyboardEvent} e
   */
  function handleKeyDown(e) {
    if (closeOnEsc && e.key === "Escape") {
      close();
      return;
    }

    if (modal && e.key === "Tab") {
      trapFocus(modal, e);
      e.preventDefault();
      return;
    }
    // needed to prevent arrow up / down etc. in FileList
    e.stopPropagation();
  }

  const previouslyFocused = /** @type {HTMLElement} */ (
    typeof document !== "undefined" && document.activeElement
  );

  if (previouslyFocused) {
    onDestroy(() => {
      previouslyFocused.focus();
    });
  }
</script>

{#if open}
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    tabindex="0"
    role="dialog"
    on:keydown={handleKeyDown}
    class="absolute w-fit min-w-[360px] shadow-xl shadow-md bg-white flex flex-col text-black text-sm"
    bind:this={modal}
    use:draggable={{ handle: dragHandle }}
    use:positionModal
  >
    <!-- title area -->
    <div
      class="flex items-center bg-blue-50 py-2 cursor-grab"
      bind:this={dragHandle}
    >
      <div class="grow ml-2">
        {title}
      </div>
      <button
        class="btn-dlg hover:bg-blue-200 mr-2 text-gray-700"
        on:click={close}
      >
        <Close size={20} />
      </button>
    </div>

    <!-- main body -->
    <slot name="main" />

    <!-- buttons -->
    {#if noButtons}
      <div />
    {:else}
      <div class="bg-gray-100 px-2 py-2">
        <slot name="bottom" />
      </div>
    {/if}
  </div>
{/if}

<style>
  /* :focus-within is not set by focus() so we normalize the style
  of :focus and :focus-with of buttons inside dialogs */
  :global(.btn-dlg:focus) {
    outline-color: blue;
    outline-style: solid;
    outline-width: 2px;
  }
  :global(.btn-dlg:ocus-within) {
    outline-color: blue;
    outline-style: solid;
    outline-width: 2px;
  }
</style>
