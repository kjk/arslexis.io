<script context="module">
  import { Archive } from "../libarchive/libarchive.js";

  /** @typedef {import("../libarchive/compressed-file").CompressedFile} CompressedFile */
  /** @typedef {import("../util").FileWithPath} FileWithPath */

  /**
   * @typedef {Object} ArchiveFile
   * @property {CompressedFile} file
   * @property {string} path
   * @property {URL} imgURL
   */

  /**
   * @typedef {Object} ArchiveExt
   * @property {FileWithPath} file
   * @property {Archive} archive
   * @property {ArchiveFile[]} entries
   */
</script>

<script>
  import FileDrop from "../FileDrop.svelte";
  import { fmtNum, fmtSize, len } from "../util";
  import TopNav from "../TopNav.svelte";
  import { naturalSort, setInsensitive } from "../natural_sort";

  setInsensitive(true);

  Archive.init({
    workerUrl: "/libarchive/worker-bundle.js",
  });

  /** @type {ArchiveExt} */
  let archive = null;

  /**
   * @param {ArchiveFile[]} a
   */
  function sortArchiveEntries(a) {
    a.sort((a, b) => {
      const aName = a.file.name;
      const bName = b.file.name;
      return naturalSort(aName, bName);
    });
  }

  function rerenderFiles() {
    archive = archive;
  }

  async function decompressAll(a) {
    for (let e of a.entries) {
      console.log("started extracting ", e.file.name);
      let data = await e.file.extract();
      console.log("extracted ", e.file.name);
      const uri = URL.createObjectURL(data);
      e.imgURL = uri;
      rerenderFiles();
    }
  }

  /**
   * @param {FileWithPath[]} filesIn
   */
  async function onfiles(filesIn) {
    console.log("onfiles:", filesIn);
    for (let fi of filesIn) {
      try {
        let a = {};
        a.file = fi;
        a.archive = await Archive.open(fi.file);
        a.entries = await a.archive.getFilesArray();
        sortArchiveEntries(a.entries);
        console.log("getArchiveEntries:", a.entries);
        archive = a;
        decompressAll(a);
        return;
      } catch (e) {
        console.log("e:", e);
      }
    }
  }

  /**
   * @param {FileWithPath} fi
   */
  function fileInfo(fi) {
    return fi.path + ", " + fmtSize(fi.file.size);
  }

  /**
   * @param {ArchiveFile} e
   */
  function isImageEntry(e) {
    const name = e.file.name.toLowerCase();
    return (
      name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png")
    );
  }
</script>

<TopNav>
  <span class="text-purple-800">Comic Book (.cbz,.cbr) reader</span>
</TopNav>

{#if archive}
  <div class="flex justify-center">
    <button
      class="border-2 px-4 py-2 hover:bg-gray-100"
      on:click={() => (archive = null)}>Select another file to view</button
    >
  </div>

  <div class="flex flex-col ml-4 mt-4">
    <div class="font-bold">
      {fileInfo(archive.file)}
    </div>

    <div class="flex flex-row flex-wrap gap-x-4 gap-y-4">
      {#each archive.entries as e (e.file.name)}
        {#if isImageEntry(e)}
          {#if e.imgURL}
            <img src={e.imgURL} class="w-[160px]" alt={e.file.name} />
          {/if}
        {/if}
      {/each}
    </div>
  </div>
{:else}
  <div class="mx-4">
    <FileDrop
      {onfiles}
      allowedExts={[".cbr", ".cbz"]}
      text="drop .cbr,.cbz files here or click button to open from computer"
    />
  </div>
{/if}
