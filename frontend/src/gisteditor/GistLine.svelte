<svelte:options runes={true} />

<script>
  import Overlay from "../Overlay.svelte";
  import { positionnode } from "../actions/positionnode.js";
  import * as githubapi from "../githubapi.js";
  import { deleteLocalGist, refreshGistsForLoggedUser } from "./store.js";
  import { logGistEvent } from "../events.js";
  import { removeDescriptionAd } from "../util.js";

  let defGist = {
    files: {},
    id: "",
    description: "",
    public: false,
    isLocalGist: false,
  };

  let { gist = defGist } = $props();

  let files = Object.keys(gist.files);
  let filesString = files.join(", ");
  let gistType = $state("");
  let showingMenu = $state(false);
  let menuElement = $state(undefined);
  let isDeletable = true;

  if (!gist.public) {
    gistType = "private";
  }
  if (gist.isLocalGist) {
    gistType = "local";
  }

  function showMenu(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    showingMenu = true;
  }

  async function deleteLocal() {
    // not logged directly in deleteLocalGist because
    // deleteLocalGist is also called when saving local to github
    logGistEvent("deleteLocalGist");
    await deleteLocalGist(gist.id);
    // window.goToURL("/home", "Home");
  }

  async function deleteGist(ev) {
    ev.preventDefaults();
    ev.stopPropagation();
    if (gist.isLocalGist) {
      deleteLocal();
      return;
    }
    const ok = await githubapi.deleteGist(gist.id);
    if (!ok) {
      console.log("deleteGist() failed");
      return;
    }
    refreshGistsForLoggedUser(true);
    // window.goToURL("/home", "Home");
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div data-gist-id={gist.id}>
  <div class="flex text-black truncate ml-2 mr-2 flex-grow">
    {removeDescriptionAd(gist.description || "<untitled>")}
    {#if gistType}
      <div
        class="text-xs text-gray-600 border border-gray-300 mx-2 px-2 py-0.5"
      >
        {gistType}
      </div>
    {/if}
  </div>
  <div class="truncate whitespace-pre pr-4 text-gray-500">{filesString}</div>
  <div
    class="self-center text-gray-400 hover:bg-gray-200 px-2 py-1"
    bind:this={menuElement}
    onclick={showMenu}
  >
    <svg viewBox="0 0 13 3" style="width: 15px; height: 13px;">
      <g>
        <path d="M3,1.5A1.5,1.5,0,1,1,1.5,0,1.5,1.5,0,0,1,3,1.5Z" />
        <path d="M8,1.5A1.5,1.5,0,1,1,6.5,0,1.5,1.5,0,0,1,8,1.5Z" />
        <path d="M13,1.5A1.5,1.5,0,1,1,11.5,0,1.5,1.5,0,0,1,13,1.5Z" />
      </g>
    </svg>
  </div>

  {#if showingMenu}
    <Overlay bind:open={showingMenu}>
      <div
        class="dropdown-content shadow"
        use:positionnode={{
          node: menuElement,
          position: "bottom-right",
          offsety: 4,
        }}
        style={"display: flex; font-size: 9.5pt"}
      >
        {#if isDeletable}
          <button class="!text-red-600" onclick={deleteGist}>Delete</button>
        {/if}
      </div>
    </Overlay>
  {/if}
</div>
