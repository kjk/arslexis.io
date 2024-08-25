<script module>
  /**
   * @param {string} s
   * @returns {string}
   */
  export function fixMenuName(s) {
    if (!s) {
      if (s === "") {
        return "";
      }
    }
    s = s.replace("&", "");
    // remove keyboard shortcut
    let parts = s.split("\t");
    return parts[0];
  }
  export const menuSep = "---";
</script>

<script>
  import { parseShortcut, serializeShortuct } from "./keys.js";
  import { len, splitMax } from "./util.js";

  // based on https://play.tailwindcss.com/0xQBSdXxsK

  /** @type {{
   menu: any[],   // array of menu items
   nest: number,
   filterFn: Function,
   onmenucmd: (cmd: string, ev: Event) => void,
}}*/
  let { menu, nest = 1, filterFn, onmenucmd } = $props();

  // nest: menu nesting needed to style child based on parent
  // see menu-parent1, menu-parent2, menu-parent3,
  // menu-child1, menu-child2, menu-child3 global classes

  function sanitizeShortcut(txt) {
    const s = parseShortcut(txt);
    if (s === null) {
      return txt;
    }
    const res = serializeShortuct(s);
    return res;
  }

  /**
   * @param {string[]} mi
   * @returns {string}
   */
  function getShortcut(mi) {
    let s = mi[0];
    let parts = splitMax(s, "\t", 2);
    if (len(parts) > 1) {
      return sanitizeShortcut(parts[1]);
    }
    // TODO: remove this
    // for the old style menu
    if (len(mi) > 2) {
      return mi[2];
    }
    return "";
  }

  function eatClick(ev) {
    console.log("eat:", ev);
    ev.preventDefault();
    ev.stopPropagation();
  }

  /**
   * @param {MouseEvent} ev
   */
  function handleMouseEnter(ev) {
    let el = /** @type {HTMLElement} */ (ev.target);
    if (el.tagName != "DIV") {
      return;
    }
    // console.log("mouse enter target:", el);
    el.classList.add("is-selected-menu");
    ev.stopPropagation();
  }

  /**
   * @param {MouseEvent} ev
   */
  function handleMouseOver(ev) {
    let el = /** @type {HTMLElement} */ (ev.target);
    if (el.tagName != "DIV") {
      return;
    }
    // console.log("mouse over target:", el);
    el.classList.add("is-selected-menu");
    ev.stopPropagation();
  }

  /**
   * @param {MouseEvent} ev
   */
  function handleMouseLeave(ev) {
    let el = /** @type {HTMLElement} */ (ev.target);
    if (el.tagName != "DIV") {
      return;
    }
    // console.log("mouse leave target:", el);
    el.classList.remove("is-selected-menu");
    ev.stopPropagation();
  }

  /**
   * @param {MouseEvent} ev
   */
  function handleClicked(ev) {
    // console.log("menuCliced: ev:", ev);
    // find the parent div that has data-menu-id attribute
    let el = /** @type {HTMLElement} */ (ev.target);
    while (el && el.tagName != "DIV") {
      el = el.parentElement;
    }
    if (!el) {
      console.log("Menu.svelte: menuClicked, no div parent for:", ev.target);
      return;
    }
    const cmdId = el.dataset.cmdId; // get data-cmd-id
    if (!cmdId || cmdId === "") {
      console.log("Menu.svelte: menuClicked: no data-menu-id on:", el);
      return;
    }
    onmenucmd(cmdId, null);
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  role="menu"
  tabindex="-1"
  class="mt-1 rounded-md border border-neutral-50 bg-white py-1 shadow-lg"
  onclick={handleClicked}
>
  {#each menu as mi}
    {@const isDiv = mi === menuSep || mi[0] === menuSep}
    {@const text = fixMenuName(mi[0])}
    {@const cmdId = mi[1]}
    {@const shortcut = getShortcut(mi)}
    {@const submenu = mi[1]}
    {@const isSubmenu = Array.isArray(submenu)}
    {@const shouldFilter = filterFn && filterFn(mi)}
    {#if !shouldFilter}
      {#if isDiv}
        <div class="border-y border-gray-200 mt-1 mb-1"></div>
      {:else if isSubmenu}
        <!-- svelte-ignore a11y_mouse_events_have_key_events -->
        <div
          role="menuitem"
          tabindex="-1"
          class="menu-parent{nest} relative my-1"
          onmouseleave={handleMouseLeave}
          onmouseover={handleMouseOver}
          onmouseenter={handleMouseEnter}
        >
          <button
            class="flex w-full items-center justify-between pl-3 pr-2 py-0.5"
          >
            <span class="flex">
              <span class="w-4 h-4"></span>
              <span class="ml-2">{text}</span>
            </span>
            <svg
              class="h-4 w-4 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
          <div
            class="menu-child{nest} invisible absolute top-0 left-full transform opacity-0 transition-all duration-300"
          >
            <svelte:self menu={submenu} nest={nest + 1} />
          </div>
        </div>
      {:else}
        <!-- svelte-ignore a11y_mouse_events_have_key_events -->
        <div
          role="menuitem"
          tabindex="-1"
          data-cmd-id={cmdId}
          class="min-w-[18em] flex items-center justify-between px-3 py-1 whitespace-nowrap"
          onmouseleave={handleMouseLeave}
          onmouseover={handleMouseOver}
        >
          <span class="flex items-center">
            <svg
              class="w-4 h-4 check invisible"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="m10 16.4l-4-4L7.4 11l2.6 2.6L16.6 7L18 8.4Z"
              /></svg
            >
            <span class="ml-2">{text}</span>
          </span>
          <span class="ml-2 text-xs opacity-75">{shortcut || ""}</span>
        </div>
      {/if}
    {/if}
  {/each}
</div>

<style>
  :global(.is-selected-menu) {
    background-color: #f5f5f5;
  }

  :global(.menu-disabled) {
    /* TODO: pointer-events and cursor don't seem to take */
    pointer-events: none !important;
    cursor: default !important;
    color: lightgray;
  }

  :global(.menu-checked .check) {
    opacity: 100%;
    visibility: visible;
  }

  :global(
      .menu-parent1:hover .menu-child1,
      .menu-parent1:focus-within .menu-child1
    ) {
    opacity: 100%;
    visibility: visible;
  }

  :global(
      .menu-parent2:hover .menu-child2,
      .menu-parent2:focus-within .menu-child2
    ) {
    opacity: 100%;
    visibility: visible;
  }

  :global(
      .menu-parent3:hover .menu-child3,
      .menu-parent3:focus-within .menu-child3
    ) {
    opacity: 100%;
    visibility: visible;
  }
</style>
