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
  export let onClose;
  // TODO: always true?
  export let closeOnEsc = true;
  export let noButtons = false;

  let overlay = null;
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

  /**
   * @param {MouseEvent} e
   */
  function handleClick(e) {
    if (e.target == overlay) {
      // clicked on overlay => dismiss
      e.stopPropagation();
      e.preventDefault();
      close();
    }
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
  <!-- svelte-ignore a11y-no-noninteractive-tabindex a11y-no-static-element-interactions -->
  <div
    class="fixed inset-0 z-40 bg-gray-600/40"
    bind:this={overlay}
    on:click={handleClick}
    on:keydown={handleKeyDown}
  >
    <div
      tabindex="0"
      role="dialog"
      class="absolute w-fit min-w-[360px] shadow-md bg-white flex flex-col text-black text-sm"
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
          <Close size="20" />
        </button>
      </div>

      <!-- main body -->
      <slot name="main" />

      <!-- buttons -->
      {#if noButtons}
        <div></div>
      {:else}
        <div class="bg-gray-100 px-2 py-2">
          <slot name="bottom" />
        </div>
      {/if}
    </div>
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
