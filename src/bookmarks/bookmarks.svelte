<svelte:options runes={true} />

<script lang="ts">
  import { onMount } from "svelte";

  /**
   @typedef {{
    url: string,
    name: string,
    tags: string[],
   }} Bookmark
  */

  function readBookmarksFromLS() {
    let key = "b:bookmarks.json";
  }
  onMount(() => {});

  function importBookmarks() {
    console.log("import bookmarks");
  }
</script>

<div class="flex flex-col">
  <div>Hello to bookmarks</div>
  <button
    class="border border-gray-400 px-2 py-1 hover:bg-gray-300 self-center"
    onclick={importBookmarks}>Import bookmarks</button
  >
</div>
