<script>
  import SvgDots from "../svg/SvgDots.svelte";
  import SelectLangDialog from "./SelectLangDialog.svelte";
  import { tooltip } from "../actions/tooltip.js";
  import { goToCreateNewGist } from "./router.js";

  let showSelectLang = false;
  let dotsStyle = `
  width: 15px;
  height: 13px;
`;

  function createNewGoGist() {
    goToCreateNewGist("go");
  }

  function createNewTextGist() {
    goToCreateNewGist("text");
  }

  function createNewMdGist() {
    goToCreateNewGist("markdown");
  }

  function onMoreClick() {
    showSelectLang = true;
  }
</script>

<div class="flex flex-row justify-center text-sm items-center">
  <div class="whitespace-nowrap">New gist:</div>
  <button
    class="btn"
    on:click={createNewTextGist}
    use:tooltip={"Create new text gist"}
  >
    Text
  </button>
  <button
    class="btn"
    on:click={createNewMdGist}
    use:tooltip={"Create new markdown gist"}
  >
    Markdown
  </button>
  <button
    class="btn"
    on:click={createNewGoGist}
    use:tooltip={"Create new Go gist"}
  >
    Go
  </button>

  <!-- a hack to hide the tooltip when we are showing lang selector -->
  <!-- maybe won't be needed if we add overlay -->
  {#if showSelectLang}
    <button class="btn" on:click={onMoreClick}>
      <SvgDots style={dotsStyle} />
    </button>
  {:else}
    <button class="btn" on:click={onMoreClick} use:tooltip={"Create new gist"}>
      <SvgDots style={dotsStyle} />
    </button>
  {/if}
</div>

{#if showSelectLang}
  <SelectLangDialog bind:open={showSelectLang} />
{/if}

<style>
  .btn {
    margin-left: 1em;
    padding-left: 0.75em;
    padding-right: 0.75em;

    border: 1px solid rgba(27, 31, 35, 0.15);
    /* needed for safari */
    background-color: white;
    cursor: pointer;

    /* text-xs */
    /* font-size: 0.75rem;
    line-height: 1rem; */

    /* text-sm */
    font-size: 0.875rem;
    line-height: 1.25rem;

    height: 1.5rem;
  }

  .btn:hover {
    background-color: #f3f3f3;
  }
</style>
