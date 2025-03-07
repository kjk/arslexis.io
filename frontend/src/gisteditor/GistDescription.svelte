<svelte:options runes={true} />

<script>
  import { len, removeDescriptionAd } from "../util.js";
  import { tooltip } from "../actions/tooltip.js";

  /** @typedef { import("./EditorCodeMirror.svelte").Gist } Gist */
  /**
   @type {{
    gist: Gist,
    descriptionChanged: (s: string) => void,
   }}
   */
  let { gist, descriptionChanged = (s) => {} } = $props();

  let description = $state(removeDescriptionAd(gist.description));

  let editingDescription = $state(null);

  let gistType = $state("");
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

<!-- svelte-ignore a11y_click_events_have_key_events -->
{#if editingDescription === null}
  <div
    role="button"
    tabindex=""
    class="truncate"
    use:tooltip={"Click to edit description"}
    onclick={startEditDescription}
    class:no-description={!description}
  >
    {description || "no description"}
  </div>
  {#if gistType}
    <div
      class="text-xs text-gray-600 border border-gray-300 px-1 pt-0.25 pb-0.5"
    >
      {gistType}
    </div>
  {/if}
  <div class="grow"></div>
{:else}
  <!-- svelte-ignore a11y_autofocus -->
  <input
    class="grow outline-hidden w-full border border-gray-400"
    autofocus
    spellcheck={false}
    bind:value={editingDescription}
    onfocus={selectDescriptionInput}
    onblur={closeDescriptionEdit}
    onkeydown={descriptionEditKeyDown}
  />
{/if}

<style>
  .no-description {
    color: lightgray;
  }
</style>
