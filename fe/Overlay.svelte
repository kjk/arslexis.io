<script>
  import { onMount } from "svelte";

  export let ondismiss; // function
  export let dismissWithEsc = false;

  let overlay = null;

  if (!ondismiss) {
    throw new Error("ondimiss property is requred");
  }

  function removeKeyHandler() {
    document.removeEventListener("keydown", handleKeyDown);
  }
  onMount(() => {
    if (dismissWithEsc) {
      document.addEventListener("keydown", handleKeyDown);
      return removeKeyHandler;
    }
  });

  function handleKeyDown(ev) {
    if (ev.which === 27) {
      ondismiss();
    }
  }

  function handleClick(ev) {
    if (ev.target !== overlay) {
      // clicked outside of the overlay
      return;
    }
    ev.stopPropagation();
    ev.preventDefault();
    ondismiss();
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={overlay}
  class="fixed inset-0 bg-gray-600 bg-opacity-40 z-50"
  on:click={handleClick}
>
  <slot />
</div>
