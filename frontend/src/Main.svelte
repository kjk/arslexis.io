<script>
  let host = location.host; // localhost:9301 or arslexis.io
  function isLocal() {
    return host.includes("localhost");
  }
</script>

<div class="flex items-center justify-between mx-4 mt-2 fixed top-0 right-0">
  <div class="flex">
    <a
      class="px-1 py-1 mr-1 hover:underline text-xs"
      href="https://github.com/kjk/tools.arslexis.io/discussions"
      target="_blank"
      rel="noreferrer"
    >
      feedback
    </a>
    <a
      class="px-1 py-1 mr-1 hover:bg-gray-100"
      href="https://github.com/kjk/tools.arslexis.io"
      target="_blank"
      rel="noreferrer"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="icon icon-tabler icon-tabler-brand-github"
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path
          d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5"
        />
      </svg>
    </a>
    <a
      class="px-1 py-1 mr-2 hover:bg-gray-100"
      href="https://twitter.com/kjk"
      target="_blank"
      rel="noreferrer"
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        class="icon icon-tabler icon-tabler-brand-twitter"
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path
          d="M22 4.01c-1 .49 -1.98 .689 -3 .99c-1.121 -1.265 -2.783 -1.335 -4.38 -.737s-2.643 2.06 -2.62 3.737v1c-3.245 .083 -6.135 -1.395 -8 -4c0 0 -4.182 7.433 4 11c-1.872 1.247 -3.739 2.088 -6 2c3.308 1.803 6.913 2.423 10.034 1.517c3.58 -1.04 6.522 -3.723 7.651 -7.742a13.84 13.84 0 0 0 .497 -3.753c0 -.249 1.51 -2.772 1.818 -4.013z"
        />
      </svg>
    </a>
    <a
      class="mr-1 hover:bg-gray-100"
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
      class="text-6xl font-bold outlined-text"
      style="font-family: 'Cooper Black', 'Arial Rounded MT Bold', 'Futura', 'Roboto', sans-serif;"
    >
      <a href="https://arslexis.io">ArsLexis</a>
    </div>
    <!-- <img src={logo} alt="ArsLexis Logo" width="220" /> -->
    <div class="text-sm text-gray-600 mt-2">
      independent software company by creator of <a
        class="underline"
        target="_blank"
        href="https://www.sumatrapdfreader.org/free-pdf-reader">SumatraPDF</a
      >
    </div>
  </div>

  <div class="text-center">
    Tools in the browser by <a
      class="underline text-gray-600"
      href="https://arslexis.io">ArsLexis</a
    >
  </div>

  <table class="table-auto mx-8 mt-2 striped-tr">
    <tbody>
      <tr>
        <td class="text-left align-top"
          ><a
            class="underline whitespace-nowrap"
            href="https://edna.arslexis.io">Edna</a
          >
        </td>
        <td class="pl-4 align-top"
          >a scratchpad / note taker for developers and race car drivers</td
        >
      </tr>

      <tr>
        <td class="text-left align-top">
          <a class="underline whitespace-nowrap" href="/gisteditor/"
            >Gist Editor</a
          >
        </td>
        <td class="pl-4 align-top"
          >GitHub Gist editor and a notepad for notes and code snippets stored
          locally in the browser</td
        >
      </tr>

      <tr>
        <td class="text-left align-top"
          ><a class="underline whitespace-nowrap" href="/notepad2/">notepad2</a>
        </td>
        <td class="pl-4 align-top"
          >like a Windows <a
            class="underline whitespace-nowrap"
            target="_blank"
            href="https://github.com/zufuliu/notepad2">notepad2</a
          >
          text editor but in the browser</td
        >
      </tr>

      <tr>
        <td><a class="underline" href="/goplayground/">Go Playground</a></td>
        <td class="pl-4 align-top">a better Go Playground</td>
      </tr>

      <!--
    <tr>
      <td class="text-left align-top">
        <a class="underline whitespace-nowrap" href="/calc/">calc</a>
      </td>
      <td class="pl-4 align-top"
        >calculator as a notepad (like Numi or Soulver)</td
      >
    </tr>
    -->

      <tr>
        <td class="text-left align-top">
          <a class="underline whitespace-nowrap" href="/unzip/">unzip</a>
        </td>
        <td class="pl-4 align-top">unzip a file in the browser</td>
      </tr>

      <tr>
        <td class="text-left align-top">
          <a class="underline whitespace-nowrap" href="/wc/">wc</a>
        </td>
        <td class="pl-4 align-top">like <tt>wc</tt>, but in the browser</td>
      </tr>

      <tr>
        <td class="text-left align-top">
          <a class="underline whitespace-nowrap" href="/fm/">File Manager</a>
        </td>
        <td class="pl-4 align-top">file manager, but in the browser</td>
      </tr>
    </tbody>
  </table>

  {#if isLocal()}
    <div id="in-progress" class="mt-4 text-center">
      Tools in progress <span class="text-red-500"
        >i.e. not fully implemented</span
      >:
    </div>

    <table class="table-auto mx-8 mt-2">
      <tbody>
        <tr>
          <td class="text-left align-top">
            <a class="underline whitespace-nowrap" href="/reader/">reader</a>
          </td>
          <td class="pl-4 align-top">Comic Book (.cbz, .cbr) reader</td>
        </tr>

        <tr>
          <td
            ><a class="underline" href="/image-resize-optimize/"
              >image resize and optimize</a
            ></td
          >
          <td class="pl-4 align-top"
            >optimize and resize multiple images at once</td
          >
        </tr>

        <tr>
          <td><a class="underline" href="/qrscanner/">qrscanner</a></td>
          <td class="pl-4 align-top">qrscanner</td>
        </tr>
      </tbody>
    </table>
  {/if}

  <div class="mt-8 mx-8 flex gap-2">
    <div>Have feedback?</div>
    <a
      class="underline"
      href="https://github.com/kjk/tools.arslexis.io/discussions"
      target="_blank">discuss</a
    >
    <div>&bull;</div>
    <a
      class="underline"
      href="https://github.com/kjk/tools.arslexis.io/issues"
      target="_blank">request features</a
    >
    <div>&bull;</div>
    <a
      class="underline"
      href="https://github.com/kjk/tools.arslexis.io/issues"
      target="_blank">report bugs</a
    >
    <div>&bull;</div>
    <a
      class="underline"
      href="https://blog.kowalczyk.info/contactme"
      target="_blank">contact me</a
    >
  </div>
  <div class="grow" />
  <hr class="mt-4" />
  <div class="text-center my-2">
    Made by&nbsp;<a
      class="underline"
      target="_blank"
      href="https://blog.kowalczyk.info">Krzysztof Kowalczyk</a
    >
  </div>
</div>

<style>
  .outlined-text {
    color: rgb(248 250 252);
    color: #fff;
    text-shadow:
      -1px -1px 0 #000,
      1px -1px 0 #000,
      -1px 1px 0 #000,
      1px 1px 0 #000;
  }
  tr:nth-child(odd) {
    @apply bg-slate-50;
  }
</style>
