<svelte:options runes={true} />

<script>
  import ShowSupportsFileSystem from "../ShowSupportsFileSystem.svelte";
  import { getFileExt, supportsFileSystem } from "../fileutil";
  import { sniffFileType } from "../sniffFileType";
  import { fmtSize, len } from "../util";
  import TopNav from "../TopNav.svelte";
  import { strCompareNoCase } from "../strutil";
  import { readDirRecurFiles } from "../fileutil-old";

  let dirName = $state("");

  /**
   * @typedef {Object} FileInfo
   * @property {number} id
   * @property {File} file
   * @property {Object} meta
   */
  /** @type {FileInfo[]} */
  let files = $state([]);

  let hasFileSystemSupport = supportsFileSystem();

  async function handleClick() {
    /** @type {FileSystemDirectoryHandle} */
    let dirHandle;
    try {
      // @ts-ignore
      dirHandle = await window.showDirectoryPicker();
    } catch {
      return;
    }
    dirName = dirHandle.name;
    let entries = await readDirRecurFiles(dirHandle, "");
    let id = 1;
    let res = [];
    // console.log("entries:", entries);
    for (let f of entries) {
      let meta = await sniffFileType(f);
      if (!meta) {
        continue;
      }
      let o = { id: id++, file: f, meta: meta };
      res.push(o);
      console.log(o);
    }
    files = res;
  }

  /**
   * @param {File} file
   */
  function fileClicked(file) {
    let d = file.slice(0, 128);
    console.log("d:", d);
  }

  /**
   * @param {FileInfo} fi
   */
  function getFileType(fi) {
    if (fi.meta) {
      return fi.meta.kind;
    }
    return "";
  }
  function getImageSize(fi) {
    if (fi.meta && fi.meta.dx) {
      return `${fi.meta.dx} x ${fi.meta.dy}`;
    }
    return "";
  }
  let nameSort = 0;
  function sortName() {
    nameSort = (nameSort + 1) % 2;
    function sortFn(f1, f2) {
      let n1 = f1.file.name;
      let n2 = f2.file.name;
      let res =
        nameSort === 0 ? strCompareNoCase(n1, n2) : strCompareNoCase(n2, n1);
      return res;
    }
    files.sort(sortFn);
    files = files;
  }

  let sizeSort = 0;
  function sortSize() {
    sizeSort = (sizeSort + 1) % 2;
    function sortFn(f1, f2) {
      let s1 = f1.file.size;
      let s2 = f2.file.size;
      if (sizeSort == 0) {
        return s1 - s2;
      }
      return s2 - s1;
    }
    files.sort(sortFn);
    files = files;
  }

  let imageSizeSort = 0;
  function sortImageSize() {
    imageSizeSort = (imageSizeSort + 1) % 2;
    function sortFn(f1, f2) {
      let s1 = f1.meta && f1.meta.dx ? f1.meta.dx * f1.meta.dy : 0;
      let s2 = f2.meta && f2.meta.dx ? f2.meta.dx * f2.meta.dy : 0;
      if (imageSizeSort == 0) {
        return s1 - s2;
      }
      return s2 - s1;
    }
    files.sort(sortFn);
    files = files;
  }
</script>

<TopNav>
  <span class="text-purple-800">Resize and optimize multiple image files</span>
</TopNav>

<div class="mx-4 mt-2">
  <ShowSupportsFileSystem />
  {#if hasFileSystemSupport}
    <div>Optimize and resize multiple image files on your computer</div>
    <div>
      <button class="underline" onclick={handleClick}
        >Select folder with images</button
      > from your computer.
    </div>
    {#if len(files) > 0}
      <div class="mt-2">
        <b>{dirName}/</b> directory with {len(files)} image files
      </div>
      <table class="relative table-auto text-xs">
        <thead>
          <tr>
            <th
              onclick={sortName}
              class="sticky top-0 bg-white hover:bg-gray-100 cursor-pointer text-center"
              >name</th
            >
            <!-- <th
              class="sticky top-0 bg-white hover:bg-gray-100 cursor-pointer text-center"
              >ext</th
            > -->
            <th
              onclick={sortSize}
              class="sticky top-0 bg-white hover:bg-gray-100 cursor-pointer text-center"
              >size</th
            >
            <th
              onclick={sortImageSize}
              class="sticky top-0 bg-white hover:bg-gray-100 cursor-pointer text-center"
              >image size</th
            >
            <th
              class="sticky top-0 bg-white hover:bg-gray-100 cursor-pointer text-center"
              >type</th
            >
          </tr>
        </thead>
        <tbody>
          {#each files as fi (fi.id)}
            <tr
              class="hover:bg-gray-50 hover:cursor-pointer"
              onclick={() => fileClicked(fi.file)}
            >
              <td class="">{fi.file.webkitRelativePath}</td>
              <!-- <td class="px-4 text-right">
                {getFileExt(fi.file.name)}
              </td> -->
              <td class="px-4 text-right">
                {fmtSize(fi.file.size)}
              </td>
              <td class="px-4 text-right">
                {getImageSize(fi)}
              </td>
              <td class="px-4 text-right">
                {getFileType(fi)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {/if}
  <div class="mt-4"></div>
</div>
