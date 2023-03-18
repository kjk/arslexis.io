<script>
  import { len, removeDescriptionAd } from "../util.js";
  import { tooltip } from "../actions/tooltip.js";

  export let gist = {};

  // function to call when description changes
  export let descriptionChanged = function (s) {};

  let description = removeDescriptionAd(gist.description);
  let editingDescription = null;

  let gistType = "";
  if (!gist.public) {
    gistType = "private";
  }
  if (gist.isLocalGist) {
    gistType = "local";
  }

  function startEditDescription() {
    // console.log("startEditDescription");
    editingDescription = description;
  }

  function selectDescriptionInput(event) {
    const n = len(description);
    const el = event.target;
    // console.log("selectDescriptionInput:", n, "el:", el);
    setTimeout(() => {
      el.setSelectionRange(0, n);
    });
  }

  function closeDescriptionEdit() {
    // console.log("closeDescriptionEdit");
    description = editingDescription;
    editingDescription = null;
    descriptionChanged(description);
  }

  function descriptionEditKeyDown(e) {
    // console.log("tabEditKeyDown:", e.which);
    if (e.which === 13) {
      e.target.blur();
      return;
    }
    // on esc abandon editing
    if (e.which === 27) {
      editingDescription = description;
      e.target.blur();
      return;
    }
  }
</script>

{#if editingDescription === null}
  <div class="flex items-baseline flex-grow border border-transparent">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="truncate"
      use:tooltip={"Click to edit description"}
      on:click={startEditDescription}
      class:no-description={!description}
    >
      {description || "no description"}
    </div>
    {#if gistType}
      <div
        class="text-xs text-gray-600 border border-gray-300 mt-1 ml-2 px-2 py-0.5"
      >
        {gistType}
      </div>
    {/if}
  </div>
{:else}
  <!-- svelte-ignore a11y-autofocus -->
  <div class="flex-grow border border-transparent">
    <input
      class="outline-none w-full border border-gray-400"
      autofocus
      spellcheck={false}
      bind:value={editingDescription}
      on:focus={selectDescriptionInput}
      on:blur={closeDescriptionEdit}
      on:keydown={descriptionEditKeyDown}
    />
  </div>
{/if}

<style>
  .no-description {
    color: lightgray;
  }
</style>
