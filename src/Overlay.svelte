<script lang="ts">
  import { onDestroy } from "svelte";
  import { focus } from "./actions/focus";
  import { trapFocus } from "./util";

  export let open = false;
  export let closeOnEsc = true;

  let overlay = null;

  function close() {
    open = false;
  }

  /**
   * @param {MouseEvent} ev
   */
  function handleClick(ev) {
    console.log("Overlay: handleClick:", ev);
    if (ev.target == overlay) {
      // clicked on overlay => dismiss
      ev.stopPropagation();
      close();
    }
  }

  /**
   * @param {KeyboardEvent} e
   */
  function handleKeyDown(e) {
    // console.log("Overlay: handleKeyDown", e);
    if (closeOnEsc && e.key === "Escape") {
      close();
      return;
    }

    if (e.key === "Tab") {
      trapFocus(overlay, e);
      e.preventDefault();
      return;
    }

    // e.stopPropagation();
  }

  const previouslyFocused = /** @type {HTMLElement} */ (
    typeof document !== "undefined" && document.activeElement
  );
  if (previouslyFocused) {
    // console.log("Overlay: captured previouslyFocused:", previouslyFocused);
    onDestroy(() => {
      // console.log("Overlay: restoring focus to:", previouslyFocused);
      previouslyFocused.focus();
    });
  }
</script>

{#if open}
  <!-- svelte-ignore a11y-no-noninteractive-tabindex a11y-no-static-element-interactions -->
  <div
    tabindex="-1"
    use:focus
    class="fixed inset-0 z-50 flex bg-gray-600/40 text-black"
    bind:this={overlay}
    on:click={handleClick}
    on:keydown={handleKeyDown}
  >
    <slot />
  </div>
{/if}
