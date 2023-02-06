<script>
  import { onDestroy, onMount } from "svelte";

  export let ondismiss; // function
  export let dismissWithEsc = false;

  let overlayEl = null;

  if (!ondismiss) {
    throw new Error("ondismiss property is requred");
  }

  /**
   * @param {MouseEvent} ev
   */
  function handleClick(ev) {
    // console.log("Overlay: handleClick:");
    if (ev.target !== overlayEl) {
      // clicked outside of the overlay
      return;
    }
    ev.stopPropagation();
    ev.preventDefault();
    ondismiss();
  }

  // https://hidde.blog/using-javascript-to-trap-focus-in-an-element/

  /**
   * @param {KeyboardEvent} e
   */
  function handleKeyDown(e) {
    // console.log("Overlay: handleKeyDown", e);
    if (dismissWithEsc && e.key === "Escape") {
      ondismiss();
    }

    var isTabPressed = e.key === "Tab";
    if (!isTabPressed) {
      e.stopPropagation();
      return;
    }

    // re-get focusable elements because disabled state might change
    var focusableEls = overlayEl.querySelectorAll(
      'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])'
    );
    // console.log("focusableEls:", focusableEls);
    var firstFocusableEl = focusableEls[0];
    var lastFocusableEl = focusableEls[focusableEls.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === firstFocusableEl) {
        // console.log("trapped to lastFocusableEl", lastFocusableEl);
        lastFocusableEl.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusableEl) {
        // console.log("trapped to firstFocusableEl:", firstFocusableEl);
        firstFocusableEl.focus();
        e.preventDefault();
      }
    }
  }

  // TODO: why need this and not on:keydown on the div?
  // global handler in MenuBar2 seems to interfere with that
  onMount(() => {
    document.addEventListener("keydown", handleKeyDown);
  });
  onDestroy(() => {
    document.removeEventListener("keydown", handleKeyDown);
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={overlayEl}
  class="fixed inset-0 bg-gray-600 bg-opacity-40 z-50 flex text-black"
  on:click={handleClick}
>
  <slot />
</div>
