<script>
  import { onMount } from "svelte";
  import {
    filterDataTransferEntries,
    filterFiles,
    len,
    preventDragOnElement,
    undoPreventDragOnElement,
  } from "./util";

  export let text =
    "drop file here or click button to open file from your computer";
  export let allowedExts = [];
  export let allowedFn = null;
  /** @type {Function} */
  export let onfiles;

  console.log("FileDrop: allowedExts:", allowedExts);

  /** @type {HTMLElement} */
  let dropArea;

  /**
   * @param {string} name
   */
  function allowedFile(name) {
    console.log("allowedFile:", name);
    if (allowedFn && allowedFn(name)) {
      console.log("allowed becaused allowedFn() returned true");
      return true;
    }
    if (len(allowedExts) > 0) {
      let parts = name.toLowerCase().split(".");
      let n = len(parts);
      if (n > 1) {
        const ext = "." + parts[n - 1];
        console.log("ext:", ext);
        if (allowedExts.includes(ext)) {
          console.log("is allowed because ext in allowedExt:", allowedExts);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * @param {Event} e
   */
  function handleFiles(e) {
    const target = /** @type {HTMLInputElement} */ (e.target);
    const files = filterFiles(target.files, allowedFile);
    onfiles(files);
  }

  /**
   * @param {DragEvent} e
   */
  async function handleDrop(e) {
    //console.log("handleDrop");
    const files = await filterDataTransferEntries(e.dataTransfer, allowedFile);
    onfiles(files);
  }

  function toggleHili(e) {
    const clsList = e.target.classList;
    const cls = "bg-gray-100";
    ["dragenter", "dragover"].includes(e.type)
      ? clsList.add(cls)
      : clsList.remove(cls);
  }

  onMount(() => {
    console.log("FileDrop.svelte mounted");
    preventDragOnElement(document);
    preventDragOnElement(dropArea);
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      dropArea.addEventListener(eventName, toggleHili, false);
    });
    dropArea.addEventListener("drop", handleDrop, false);
    return () => {
      undoPreventDragOnElement(document);
      undoPreventDragOnElement(dropArea);
      console.log("FileDrop.svelte unmounted");
      ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
        dropArea.removeEventListener(eventName, toggleHili, false);
      });
      dropArea.removeEventListener("drop", handleDrop, false);
    };
  });
</script>

<div
  bind:this={dropArea}
  class="w-full rounded-md border-2 border-dashed border-gray-400 bg-gray-50"
  style="height: 40vh; max-height: 300px"
>
  <form
    class="mb-4 flex flex-col items-center justify-center h-full"
    method="post"
    action=""
    enctype="miltipart/format-data"
  >
    <p>
      {text}
    </p>
    <input type="file" class="hidden" id="fileElem" on:change={handleFiles} />
    <label
      class="rounded bg-gray-300 mt-2 px-4 py-2 hover:bg-gray-200"
      for="fileElem">Open file</label
    >
  </form>
</div>

<style>
</style>
