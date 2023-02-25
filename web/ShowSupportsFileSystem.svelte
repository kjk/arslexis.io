<script>
  import { supportsFileSystem } from "./util";

  let hasFileSystemSupport = supportsFileSystem();
</script>

{#if !hasFileSystemSupport}
  <div class="mx-4 mt-2">
    This browser doesn't support <a
      href="https://caniuse.com/?search=showDirectoryPicker"
      ><tt>showDirectoryPicker</tt></a
    > API needed to access files on your computer. Supported browsers: Chrome, Edge,
    Opera.
  </div>
{/if}
