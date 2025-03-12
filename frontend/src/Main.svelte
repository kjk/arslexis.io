<svelte:options runes={true} />

<script>
  import GitHub from "./icons/GitHub.svelte";
  import Twitter from "./icons/Twitter.svelte";

  let host = location.host; // localhost:9301 or arslexis.io
  function isLocal() {
    return host.includes("localhost");
  }
</script>

<div class="flex items-center justify-between mx-4 mt-2 fixed right-0">
  <div class="flex">
    <a
      class="px-1 py-1 mr-1 icon-link"
      href="https://github.com/kjk/tools.arslexis.io"
      target="_blank"
      rel="noreferrer"
    >
      <GitHub></GitHub>
    </a>
    <a
      class="px-1 py-1 mr-2 icon-link"
      href="https://twitter.com/kjk"
      target="_blank"
      rel="noreferrer"
    >
      <Twitter></Twitter>
    </a>
    <a
      class="mr-1"
      href="https://blog.kowalczyk.info"
      target="_blank"
      rel="noreferrer"
    >
      <img
        src="https://avatars.githubusercontent.com/u/7935?v=4"
        width="20"
        height="20"
        alt="kjk"
      />
    </a>
  </div>
</div>

<div class="min-h-screen flex flex-col">
  <div class="flex flex-col items-center pt-2 pb-4">
    <div
      class="text-6xl font-bold outlined-text outline-blue-700!"
      style="font-family: 'Cooper Black', 'Arial Rounded MT Bold', 'Futura', 'Roboto', sans-serif;"
    >
      <a
        href="https://arslexis.io"
        target="_blank"
        title="ArsLexis Website"
        class="no-underline! text-white!">ArsLexis</a
      >
    </div>
    <!-- <img src={logo} alt="ArsLexis Logo" width="220" /> -->
    <div class="text-sm text-gray-600 mt-2">
      independent software company by creator of <a
        target="_blank"
        href="https://www.sumatrapdfreader.org/free-pdf-reader">SumatraPDF</a
      >
    </div>
  </div>

  <!-- <div class="text-center font-bold">Our software</div> -->

  {#snippet row(name, url, desc, blank = true)}
    <tr>
      <td class="text-left align-top">
        {#if blank}
          <a class="font-semibold whitespace-nowrap" href={url} target="_blank"
            >{name}</a
          >
        {:else}
          <a class="font-semibold whitespace-nowrap" href={url}>{name}</a>
        {/if}
      </td>
      <td class="pl-4 align-top">{@html desc}</td>
    </tr>
  {/snippet}

  {#snippet tbody()}
    {@render row(
      "Edna",
      "https://edna.arslexis.io",
      "a note taking app for developers and power users",
    )}
    {@render row(
      "SumatraPDF",
      "https://www.sumatrapdfreader.org",
      "small, fast PDF / eBook / comic book reader for Windows",
    )}
    {@render row(
      "Gist Editor",
      "/gisteditor/",
      "GitHub Gist editor and a notepad for notes and code snippets stored locally in the browser",
    )}
    <!-- {@render row(
      "notepad2",
      "/notepad2/",
      `like a Windows <a
          class="whitespace-nowrap"
          target="_blank"
          href="https://github.com/zufuliu/notepad2">notepad2</a
        >
        text editor but in the browser`,
    )} -->
    {@render row("Go Playground", "/goplayground/", "a better Go Playground")}
    <!-- {@render row(
      "calc",
      "/calc/",
      "calculator as a notepad (like Numi or Soulver)",
    )} -->
    {@render row("unzip", "/unzip/", "unzip a file in the browser")}
    {@render row("wc", "/wc/", "like <tt>wc</tt>, but in the browser")}
    {@render row("File Manager", "/fm/", "file manager, but in the browser")}
  {/snippet}

  <table class="table-auto mx-8 mt-2 striped-tr">
    <tbody>
      {@render tbody()}
      {#if isLocal()}
        <tr>
          <td colspan="2">
            <div id="in-progress" class="mt-4 text-center">
              Tools in progress <span class="text-red-500"
                >i.e. not fully implemented</span
              >:
            </div>
          </td>
        </tr>
        {@render row("bookmarks", "/bookmarks/", "bookmark manager", false)}
        {@render row("reader", "/reader/", "Comic Book (.cbz, .cbr) reader")}
        {@render row(
          "image optimize",
          "/image-resize-optimize/",
          "optimize multiple images at once",
        )}
        {@render row("qrscanner", "/qrscanner/", "qrscanner")}
      {/if}
    </tbody>
  </table>

  <table class="table-auto mx-8 mt-2">
    <tbody> </tbody>
  </table>

  <div class="mt-8 mx-8 flex gap-2">
    <div>Have feedback?</div>
    <a
      href="https://github.com/kjk/tools.arslexis.io/discussions"
      target="_blank">discuss</a
    >
    <div>&bull;</div>
    <a href="https://github.com/kjk/tools.arslexis.io/issues" target="_blank"
      >request features</a
    >
    <div>&bull;</div>
    <a href="https://github.com/kjk/tools.arslexis.io/issues" target="_blank"
      >report bugs</a
    >
    <div>&bull;</div>
    <a href="https://blog.kowalczyk.info/contactme" target="_blank"
      >contact me</a
    >
  </div>
  <div class="grow"></div>
  <hr class="mt-4" />
  <div class="text-center my-2">
    Made by&nbsp;<a target="_blank" href="https://blog.kowalczyk.info"
      >Krzysztof Kowalczyk</a
    >
  </div>
</div>

<style>
  @reference "./base.css";
  a {
    @apply underline underline-offset-2;
    @apply text-blue-700;
  }
  .outlined-text {
    color: rgb(248 250 252);
    color: #fff;
    text-shadow:
      -1px -1px 0 #000,
      1px -1px 0 #000,
      -1px 1px 0 #000,
      1px 1px 0 #000;
    /* text-shadow:
      -1px -1px 0 #00f,
      1px -1px 0 #00f,
      -1px 1px 0 #00f,
      1px 1px 0 #00f; */
  }
  /*
  tr:nth-child(odd) {
    @apply bg-slate-50;
  }
    */
</style>
