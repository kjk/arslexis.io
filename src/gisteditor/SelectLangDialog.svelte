<svelte:options runes={true} />

<script>
  import Overlay from "../Overlay.svelte";
  import { getLangNames } from "./langs.js";
  import { len, clamp } from "../util.js";
  import { scrollintoview } from "../actions/scrollintoview.js";
  import * as keys from "../keys.js";
  import { goToCreateNewGist } from "./router.js";
  import { delayedFocus } from "../actions/focus";

  /** @type {{
   open: boolean,
  }}*/
  let { open = $bindable(false) } = $props();

  let allLangs = getLangNames();
  let searchTerm = $state("");
  let selectedIdx = $state(0);
  let ignoreNextMouseEnter = false;

  function getMatchingLangs(s) {
    if (s === "") {
      return allLangs;
    }
    s = s.toLowerCase();
    const a = [];
    for (let lng of allLangs) {
      const lng2 = lng.toLowerCase();
      if (lng2.includes(s)) {
        a.push(lng);
      }
    }
    return a;
  }

  let shownLangs = $derived.by(() => {
    return getMatchingLangs(searchTerm);
  });

  $effect(() => {
    if (selectedIdx >= len(shownLangs)) {
      selectedIdx = 0;
    }
  });

  /**
   * @param {KeyboardEvent} ev
   */
  function handleKeyDown(ev) {
    if (ev.code === "Enter") {
      const lang = shownLangs[selectedIdx];
      if (typeof lang === "string") {
        selectLang(lang);
      }
      return;
    }

    let dir = 0;
    if (keys.isNavUp(ev)) {
      dir = -1;
    }
    if (keys.isNavDown(ev)) {
      dir = 1;
    }
    if (dir === 0) {
      return;
    }
    ev.stopPropagation();
    ev.preventDefault();

    selectedIdx = clamp(selectedIdx + dir, 0, len(shownLangs) - 1);
    // changing selected element triggers mouseenter
    // on the element so we have to supress it
    ignoreNextMouseEnter = true;
  }

  /**
   * @param {number} idx
   */
  function mouseEnter(idx) {
    if (ignoreNextMouseEnter) {
      ignoreNextMouseEnter = false;
      return;
    }
    selectedIdx = idx;
  }

  $effect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  });

  /**
   * @param {string} lang
   */
  function selectLang(lang) {
    goToCreateNewGist(lang);
  }
</script>

{#if open}
  <Overlay bind:open>
    <div class="dialog fixed flex flex-col bg-white border shadow-md">
      <input
        class="outline-hidden border mx-3 mb-2 mt-3 px-2 py-1 text-sm"
        bind:value={searchTerm}
        use:delayedFocus
        autocomplete="off"
      />

      <div class="overflow-y-auto my-2">
        {#each shownLangs as lang, idx}
          {#if idx === selectedIdx}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="cursor-pointer px-3 py-1 bg-gray-100"
              use:scrollintoview
              onclick={() => selectLang(lang)}
            >
              {lang}
            </div>
          {:else}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="cursor-pointer px-3 py-1"
              onclick={() => selectLang(lang)}
              onmouseenter={() => mouseEnter(idx)}
            >
              {lang}
            </div>
          {/if}
        {/each}
      </div>

      <div
        class="flex justify-between text-xs px-2 py-1 bg-gray-50 text-gray-600"
      >
        <div>&uarr; &darr; to navigate</div>
        <div>&nbsp; &crarr; to select</div>
        <div>Esc to close</div>
      </div>
    </div>
  </Overlay>
{/if}

<style>
  .dialog {
    min-width: 280px;
    top: 108px;
    max-height: calc(100vh - 108px - 10vh);
    left: calc(50% - 140px);
  }
</style>
