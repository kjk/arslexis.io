<script context="module">
  /**
   * @typedef {Object} ArchiveFileInfo
   * @property {string} name
   * @property {number} size
   */

  /**
   * @typedef {Object} ArchiveFile
   * @property {ArchiveFileInfo} file
   * @property {string} path
   */

  /**
   * @typedef {Object} ArchiveFileExt
   * @property {File} file
   * @property {ArchiveFile[]} entries
   * @property {string} error
   * @property {boolean} isDecompressing
   */
</script>

<script>
  import FileDrop from "../FileDrop.svelte";
  import { fmtNum, fmtSize, len } from "../util";
  import { Archive } from "../libarchive/libarchive.js";
  import TopNav from "../TopNav.svelte";
  import { naturalSort, setInsensitive } from "../natural_sort";

  setInsensitive(true);

  Archive.init({
    workerUrl: "/libarchive/worker-bundle.js",
  });

  // https://github.com/gildas-lormeau/zip.js/blob/gh-pages/demos/demo-read-file.js
  // https://gildas-lormeau.github.io/zip.js/

  /** @type {ArchiveFileExt[]} */
  let files = [];

  /* @type {HTMLElement} */
  let hiddenLink;

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

  /**
   * @returns {Promise<ArchiveFile[]>}
   */
  async function getArchiveEntries(file) {
    let archive = await Archive.open(file); // TODO: why typing error?
    let res = await archive.getFilesArray();
    sortArchiveEntries(res);
    console.log("getArchiveEntries:", res);
    return res;
  }

  function rerenderFiles() {
    files = files;
  }

  // https://dev.to/nombrekeff/download-file-from-blob-21ho
  // https://stackoverflow.com/questions/19327749/javascript-blob-filename-without-link
  /**
   * @param {ArchiveFileExt[]} filesIn
   */
  async function onfiles(filesIn) {
    console.log("onfiles:", filesIn);
    for (let fi of filesIn) {
      fi.isDecompressing = false;
      try {
        let e = await getArchiveEntries(fi.file);
        // console.log("entries:", e);
        fi.entries = e;
      } catch (e) {
        fi.error = e.toString();
        fi.entries = [];
        console.log("e:", e);
      }
    }
    files = filesIn;
  }

  function fileInfo(fi) {
    return fi.path + ", " + fmtSize(fi.file.size);
  }

  /**
   * @param {ArchiveFileExt} fi
   * @param {ArchiveFile} e
   */
  async function download(fi, e) {
    console.log("archive entry:", e);
    // in percent, start with 1 for immediate progress
    fi.isDecompressing = true;
    rerenderFiles();

    // TODO: password
    const data = await e.file.extract();
    // TODO: try/catch and show error
    const uri = URL.createObjectURL(data);
    hiddenLink.href = uri;
    hiddenLink.download = e.file.name;

    hiddenLink.dispatchEvent(new MouseEvent("click"));

    URL.revokeObjectURL(uri);
    fi.isDecompressing = false;
    rerenderFiles();
  }

  function fileSizeFancy(n) {
    const human = fmtSize(n);
    const s = fmtNum(n);
    return `${human} (${s})`;
  }
</script>

<a href="/" class="hidden" bind:this={hiddenLink}>dummy for auto-downloads</a>

<TopNav>
  <span class="text-purple-800">Comic Book (.cbz,.cbr) reader</span>
</TopNav>

{#if len(files) > 0}
  <div class="flex justify-center">
    <button
      class="border-2 px-4 py-2 hover:bg-gray-100"
      on:click={() => (files = [])}>Select another file to view</button
    >
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

<div class="flex flex-col">
  {#each files as fi}
    <div class="flex flex-col ml-4 mt-4">
      <div class="font-bold">
        {fileInfo(fi)}
        {#if fi.error}<span class="text-red-500">Bad file. {fi.error}</span
          >{/if}
      </div>
      {#if !fi.error}
        <div class="table text-sm font-mono ml-4">
          <div class="table-header-group">
            <div class="table-row font-semibold">
              <div class="table-cell">name</div>
              <div class="table-cell">size</div>
            </div>
          </div>
          {#each fi.entries as e}
            {@const size = e.file.size}
            {@const name = e.file.name}
            <div class="ml-4 table-row">
              {#if fi.isDecompressing}
                <div class="table-cell ml-4">is decompressing</div>
              {:else}
                <button
                  on:click={() => download(fi, e)}
                  class="table-cell underline text-blue-500">{name}</button
                >
              {/if}
              <div class="table-cell ml-4">
                {fileSizeFancy(size)}
              </div>
            </div>
            <!--
            <div class="ml-4 table-row">
            </div> -->
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>
