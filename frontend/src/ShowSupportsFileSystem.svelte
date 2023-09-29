<script>
  import { supportsFileSystem } from "./fileutil";

  let hasFileSystemSupport = supportsFileSystem();
</script>

{#if !hasFileSystemSupport}
  <div class="mx-4 mt-2">
    This browser doesn't support <a
      class="underline"
      href="https://caniuse.com/?search=showDirectoryPicker"
      ><tt>showDirectoryPicker</tt></a
    >
    API needed to access files on your computer. Supported browsers:
    <a href="https://www.google.com/chrome/" class="underline">Chrome</a>, Edge,
    <a href="https://www.opera.com/download" class="underline">Opera</a>.
  </div>
{/if}
