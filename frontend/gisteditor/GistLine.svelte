<script>
  import Overlay from "../Overlay.svelte";
  import { positionnode } from "../actions/positionnode.js";
  import * as githubapi from "../githubapi.js";
  import { deleteLocalGist, refreshGistsForLoggedUser } from "./store.js";
  import { logEvent } from "../events.js";
  import { removeDescriptionAd } from "../util.js";

  export let gist = {
    files: {},
    id: "",
    description: "",
    public: false,
    isLocalGist: false,
  };

  let files = Object.keys(gist.files);
  let filesString = files.join(", ");
  let gistType = "";
  let showingMenu = false;
  let menuElement;
  let isDeletable = true;

  if (!gist.public) {
    gistType = "private";
  }
  if (gist.isLocalGist) {
    gistType = "local";
  }

  function showMenu() {
    showingMenu = true;
  }

  async function deleteLocal() {
    // not logged directly in deleteLocalGist because
    // deleteLocalGist is also called when saving local to github
    logEvent("deleteLocalGist");
    await deleteLocalGist(gist.id);
    // window.goToURL("/home", "Home");
  }

  async function deleteGist() {
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

<div data-gist-id={gist.id}>
  <div class="flex text-black truncate ml-2 flex-grow">
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
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="self-center text-gray-400 hover:bg-gray-200 px-2 py-1"
    bind:this={menuElement}
    on:click|preventDefault|stopPropagation={showMenu}
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
          <div>
            <a
              href="/dummy"
              style="color: red"
              on:click|preventDefault|stopPropagation={deleteGist}
            >
              Delete
            </a>
          </div>
        {/if}
      </div>
    </Overlay>
  {/if}
</div>
