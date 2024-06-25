<svelte:options runes={true} />

<script>
  import Overlay from "../Overlay.svelte";
  import { tooltip } from "../actions/tooltip.js";

  let showingMenu = $state(false);

  function showMenu() {
    showingMenu = !showingMenu;
  }
  function hideMenu() {
    showingMenu = false;
  }
</script>

{#if false}
  {#if showingMenu}
    <div class="help nohover">?</div>
    <Overlay bind:open={showingMenu}>
      <div class="dropdown-content shadow-md adjust">
        <div>
          <a
            on:click={hideMenu}
            href="https://tools.arslexis.io/docs/gist-editor"
            target="_blank"
            rel="noreferrer"
          >
            About
          </a>
        </div>
        <div>
          <a
            on:click={hideMenu}
            href="https://tools.arslexis.io/docs/gist-editor"
            target="_blank"
            rel="noreferrer"
          >
            Documentation
          </a>
        </div>
        <!--
      <div>
        <a
          on:click={hideMenu}
          href="https://reddit.com/r/CodeEvalApp/"
          target="_blank">
          Support
        </a>
      </div>
      -->
      </div>
    </Overlay>
  {:else}
    <button
      class="help"
      use:tooltip={{ text: "Help, feedback", position: "top" }}
      on:click|preventDefault={showMenu}
    >
      ?
    </button>
  {/if}
{/if}

<style>
  .help {
    cursor: pointer;
    user-select: none;
    transition:
      opacity 700ms ease 0s,
      color 700ms ease 0s;
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    bottom: 16px;
    right: 24px;
    width: 36px;
    height: 36px;
    border-radius: 100%;
    font-size: 20px;
    box-shadow:
      rgba(15, 15, 15, 0.1) 0px 0px 0px 1px,
      rgba(15, 15, 15, 0.1) 0px 2px 4px;
    z-index: 40;
    opacity: 1;
  }
  .help:hover {
    background-color: #ededed;
  }
  .nohover:hover {
    background-color: white;
  }
  .adjust {
    font-size: 0.9em;
    bottom: 68px;
    right: 16px;
    display: flex;
  }
</style>
