<script>
  import { getContext } from "svelte";
  import Close from "./icons/Close.svelte";
  import { draggable } from "@neodrag/svelte";

  export let title = "";

  let fnDismissDialog = getContext("fnDismissDialog");

  let dragHandleEl = null;

  /**
   * @param {HTMLElement} node
   */
  function centerScreen(node) {
    let dx = screen.width;
    let dy = screen.height;
    const r = node.getBoundingClientRect();
    let x = (dx / 2 - r.width) / 2;
    let y = (dy / 2 - r.height) / 2;
    const st = node.style;
    st.left = `${x}px`;
    st.top = `${y}px`;
  }
</script>

<div
  class="absolute shadow-xl bg-white max-w-[80vw] flex flex-col text-sm w-fit"
  use:centerScreen
  use:draggable={{ handle: dragHandleEl }}
>
  <!-- title area -->
  <div
    class="flex items-center bg-blue-50 py-2  cursor-grab"
    bind:this={dragHandleEl}
  >
    <div class="grow ml-2">
      {title}
    </div>
    <button
      class="hover:bg-gray-200 mr-2 text-gray-700"
      on:click={fnDismissDialog}
    >
      <Close size={20} />
    </button>
  </div>

  <!-- main body -->
  <slot name="main" />

  <!-- buttons -->
  <div class="bg-gray-100 px-2 py-2">
    <slot name="bottom" />
  </div>
</div>
