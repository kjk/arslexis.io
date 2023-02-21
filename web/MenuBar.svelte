<script>
  // menu based on https://play.tailwindcss.com/0xQBSdXxsK
  import Menu, { fixMenuName } from "./Menu.svelte";
  import { onMount, createEventDispatcher } from "svelte";
  import { len, splitMax } from "./util";
  import { parseShortcut } from "./keys";

  const dispatch = createEventDispatcher();

  export let menuBar; // definition of the menubar

  // function called when menu has been opened
  // allows the owner to modify the menu by changing DOM
  /** @type {Function} */
  export let menuDidOpenFn = null;

  /** @type {HTMLElement} */
  let menuBarElement = null;

  /** @type {import("./keys").Shortcut[]} */
  let keyboardShortcuts = [];

  function buildKeyboarShortcutsMenu(menu) {
    for (let mi of menu) {
      let s = mi[0];
      let cmdIdOrSubmenu = mi[1];
      let isSubmenu = Array.isArray(cmdIdOrSubmenu);
      if (isSubmenu) {
        buildKeyboarShortcutsMenu(cmdIdOrSubmenu);
        continue;
      }
      let cmdId = cmdIdOrSubmenu;
      let parts = splitMax(s, "\t", 2);
      if (len(parts) < 2) {
        continue;
      }
      s = parts[1];
      let res = parseShortcut(s);
      if (res) {
        res.cmdId = cmdId;
        keyboardShortcuts.push(res);
      } else {
        console.log("Unrecognized shortcut:", s);
      }
    }
  }

  function buildKeyboardShortcutsBar() {
    // console.log("buildKeyboardShortcutsBar");
    for (let mi of menuBar) {
      let menu = mi[1];
      buildKeyboarShortcutsMenu(menu);
    }
  }

  buildKeyboardShortcutsBar();

  /**
   * @param {HTMLElement} el
   * @returns {HTMLElement}
   */
  function getMenuParentElement(el) {
    while (el) {
      // console.log("el:", el);
      // console.log("el.classList:", el.classList);
      if (el.classList.contains("parent")) {
        return el;
      }
      el = el.parentElement;
    }
    return el;
  }

  /**
   * @param {FocusEvent} ev
   */
  function handleFocus(ev) {
    // <button> gets the focus
    if (!menuDidOpenFn) {
      return;
    }
    // console.log("handleFocus:", ev);
    // ev.target is button, a child of the actual element
    // so traverse up to find the real parent
    let el = /** @type {HTMLElement} */ (ev.target);
    el = getMenuParentElement(el);
    if (!el) {
      console.log("handleFocus: didn't find menu parent, target:", ev.target);
      return;
    }
    // console.log("handleFocusIn:", el);
    menuDidOpenFn(el);
  }

  /**
   * focus() menu when mouse is over (hover) so that
   * no need to click on menu to open it
   * @param {MouseEvent} ev
   */
  function handleMouseOver(ev) {
    // /**@type {HTMLElement}*/ (ev.target).focus();
  }

  /**
   * @param {KeyboardEvent} ev
   */
  function handleKeyDown(ev) {
    if (false) {
      const sev = {
        key: ev.key,
        shiftKey: ev.shiftKey,
        ctrlKey: ev.ctrlKey,
        altKey: ev.altKey,
        metaKey: ev.metaKey,
      };
      console.log("handleKeyDown:", sev);
    }
    let menuEl = /** @type {HTMLElement} */ (document.activeElement);
    // console.log("menuEl:", menuEl);
    let isMenuOpen = menuEl && menuEl.classList.contains("menu-trigger");
    if (isMenuOpen) {
      // TODO: keyboard navigation
      return;
    }
    for (let ks of keyboardShortcuts) {
      if (ev.shiftKey != ks.shiftKey) {
        continue;
      }
      if (ev.ctrlKey != ks.ctrlKey) {
        continue;
      }
      if (ev.altKey != ks.altKey) {
        continue;
      }
      if (ev.metaKey != ks.metaKey) {
        continue;
      }
      if (ev.key != ks.key) {
        continue;
      }
      // handler is responsible for stopping propagation of the event
      // console.log("handleKeyDown: ks", ks);
      dispatch("menucmd", { ev: ev, cmd: ks.cmdId });
    }
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  });
</script>

{#if !menuBar}
  <!-- empty element so that we still process keyboard events -->
  <div />
{:else}
  <div
    class="z-20 flex items-center gap-2 bg-white py-0 select-none"
    bind:this={menuBarElement}
  >
    <div class="flex justify-center cursor-pointer">
      {#each menuBar as mi}
        {@const title = mi[0]}
        {@const menu = mi[1]}
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <div class="parent relative" tabindex="-1" role="menubar">
          <button
            class="rounded-md px-3 py-1 hover:bg-black/5 menu-trigger"
            on:mouseover={handleMouseOver}
            on:focus={handleFocus}>{fixMenuName(title)}</button
          >
          <div
            class="child invisible absolute top-0 top-full transform opacity-0 transition-all duration-100"
          >
            <Menu on:menucmd {menu} />
          </div>
        </div>
      {/each}
    </div>
    <div class="grow" />
    <!-- <div class="mr-4">on the right</div> -->
  </div>
{/if}

<style>
  .parent:focus-within .child {
    opacity: 100%;
    visibility: visible;
  }
</style>
