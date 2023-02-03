<script>
  // most based on https://play.tailwindcss.com/OPAsySKNCd
  // TODO: maybe even simpler like https://www.w3schools.com/howto/howto_css_loader.asp
  // TODO: not sure if needs most <div> wrappers
  export let style = "";
  if (style.indexOf("width:") == -1) {
    style = "width: 14px; height: 14px; " + style;
    // console.log("new style:", style);
  }

  export let kind = "rotate";
</script>

{#if kind == "rotate"}
  <div class="ball-clip-rotate" {style} />
{:else if kind == "3dot"}
  <div>
    <span class="inline-flex items-center gap-px">
      <span
        class="animate-blink mx-px h-1.5 w-1.5 rounded-full bg-indigo-600"
      />
      <span
        class="animate-blink animation-delay-200 mx-px h-1.5 w-1.5 rounded-full bg-indigo-600"
      />
      <span
        class="animate-blink animation-delay-[400ms] mx-px h-1.5 w-1.5 rounded-full bg-indigo-600"
      />
    </span>
  </div>
{:else if kind == "spin"}
  <div>
    <svg
      fill="none"
      class="h-8 w-8 animate-spin text-indigo-600"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clip-rule="evenodd"
        d="M15.165 8.53a.5.5 0 01-.404.58A7 7 0 1023 16a.5.5 0 011 0 8 8 0 11-9.416-7.874.5.5 0 01.58.404z"
        fill="currentColor"
        fill-rule="evenodd"
      />
    </svg>
  </div>
{:else if kind == "spin-portion"}
  <div>
    <svg
      aria-hidden="true"
      role="status"
      class="mr-2 inline h-5 w-5 animate-spin text-indigo-300"
      viewBox="0 0 100 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
        fill="currentColor"
      />
      <path
        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
        fill="rgb(79 70 229)"
      />
    </svg>
  </div>
{:else if kind == "3dot-inverse"}
  <div>
    <button
      class="inline-flex h-10 w-32 items-center justify-center rounded-md border border-transparent bg-indigo-600 px-2 py-1 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-75"
      disabled
    >
      <span class="inline-flex items-center gap-px">
        <span class="animate-blink mx-px h-1.5 w-1.5 rounded-full bg-white" />
        <span
          class="animate-blink animation-delay-150 mx-px h-1.5 w-1.5 rounded-full bg-white"
        />
        <span
          class="animate-blink animation-delay-300 mx-px h-1.5 w-1.5 rounded-full bg-white"
        />
      </span>
    </button>
  </div>
{:else if kind == "spin-inverse"}
  <div>
    <button
      class="inline-flex h-10 w-32 items-center justify-center rounded-md border border-transparent bg-indigo-600 px-2 py-1 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-75"
      disabled
    >
      <svg
        fill="none"
        class="h-8 w-8 animate-spin"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          clip-rule="evenodd"
          d="M15.165 8.53a.5.5 0 01-.404.58A7 7 0 1023 16a.5.5 0 011 0 8 8 0 11-9.416-7.874.5.5 0 01.58.404z"
          fill="currentColor"
          fill-rule="evenodd"
        />
      </svg>
    </button>
  </div>
{:else if kind == "spin-portion-inverse"}
  <div>
    <button
      class="inline-flex h-10 w-32 items-center justify-center rounded-md border border-transparent bg-indigo-600 px-2 py-1 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-75"
      disabled
    >
      <svg
        aria-hidden="true"
        role="status"
        class="mr-2 inline h-5 w-5 animate-spin text-indigo-400"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="#FFF"
        />
      </svg>
    </button>
  </div>
{:else if kind == "double-spin"}
  <!-- double spin -->
  <div>
    <span
      class="relative inset-0 inline-flex h-6 w-6 animate-spin items-center justify-center rounded-full border-2 border-gray-300 after:absolute after:h-8 after:w-8 after:rounded-full after:border-2 after:border-y-indigo-500 after:border-x-transparent"
    />
  </div>
{:else if kind == "scale/pulse"}
  <!-- scale / pulse -->
  <div>
    <span class="relative isolate inline-flex items-center justify-center">
      <span
        class="animate-scale absolute z-0 h-8 w-8 rounded-full bg-indigo-400/60"
      />
      <span
        class="animate-scale animation-delay-1000 absolute z-10 h-8 w-8 rounded-full bg-indigo-400/60"
      />
    </span>
  </div>
{:else if kind == "grid-fade"}
  <!-- grid fade -->
  <div class="flex">
    <span class="grid grid-cols-3 grid-rows-3 gap-px">
      <span class="animate-fade mx-px h-1.5 w-1.5 rounded-full bg-indigo-600" />
      <span
        class="animate-fade animation-delay-300 mx-px h-1.5 w-1.5 rounded-full bg-indigo-600"
      />
      <span
        class="animate-fade animation-delay-700 mx-px h-1.5 w-1.5 rounded-full bg-indigo-600"
      />

      <span
        class="animate-fade animation-delay-100 mx-px h-1.5 w-1.5 rounded-full bg-indigo-600"
      />
      <span
        class="animate-fade animation-delay-500 mx-px h-1.5 w-1.5 rounded-full bg-indigo-600"
      />
      <span
        class="animate-fade animation-delay-300 mx-px h-1.5 w-1.5 rounded-full bg-indigo-600"
      />
      <span
        class="animate-fade animation-delay-700 mx-px h-1.5 w-1.5 rounded-full bg-indigo-600"
      />
      <span
        class="animate-fade animation-delay-500 mx-px h-1.5 w-1.5 rounded-full bg-indigo-600"
      />
      <span
        class="animate-fade animation-delay-200 mx-px h-1.5 w-1.5 rounded-full bg-indigo-600"
      />
    </span>
  </div>
{:else if kind == "perspective"}
  <!-- perspective -->
  <div>
    <span class="animate-perspective inline-flex h-6 w-6 bg-indigo-500" />
  </div>
{:else if kind == "classic-spin"}
  <!--classic spin -->
  <div>
    <span
      class="inline-flex h-6 w-6 animate-spin rounded-full border-4 border-dotted border-indigo-600"
    />
  </div>
{:else if kind == "classic-fadein"}
  <!-- Classic fadeIn -->
  <div>
    <div
      class="[&>span]:before:animate-fadeIn relative h-6 w-6 [&>span]:absolute [&>span]:inset-0 [&>span]:inline-flex [&>span]:h-full [&>span]:w-full [&>span]:before:h-1 [&>span]:before:w-1 [&>span]:before:rounded-full [&>span]:before:bg-indigo-600"
    >
      <span class="" />
      <span class="before:!animation-delay-[-1.1s] rotate-[30deg]" />
      <span class="before:!animation-delay-[-1s] rotate-[60deg]" />
      <span class="before:!animation-delay-[-0.9s] rotate-[90deg]" />
      <span class="before:!animation-delay-[-0.8s] rotate-[120deg]" />
      <span class="before:!animation-delay-[-0.7s] rotate-[150deg]" />
      <span class="before:!animation-delay-[-0.6s] rotate-[180deg]" />
      <span class="before:!animation-delay-[-0.5s] rotate-[210deg]" />
      <span class="before:!animation-delay-[-0.4s] rotate-[240deg]" />
      <span class="before:!animation-delay-[-0.3s] rotate-[270deg]" />
      <span class="before:!animation-delay-[-0.2s] rotate-[300deg]" />
      <span class="before:!animation-delay-[-0.1s] rotate-[330deg]" />
    </div>
  </div>
{:else}
  <!-- this is the default if kind is incorrect -->
  <div class="ball-clip-rotate" {style} />
{/if}

<style>
  .ball-clip-rotate {
    box-sizing: border-box;
    display: inline-block;

    margin: 2px;

    border-radius: 100%;
    border: 2px solid #cccccc;

    background: transparent !important;
    border-bottom-color: transparent;

    animation-fill-mode: both;
    animation: rotate 1.25s 0s linear infinite;
  }

  @keyframes rotate {
    0% {
      -webkit-transform: rotate(0deg) scale(1);
      transform: rotate(0deg) scale(1);
    }
    50% {
      -webkit-transform: rotate(180deg) scale(0.6);
      transform: rotate(180deg) scale(0.6);
    }
    100% {
      -webkit-transform: rotate(360deg) scale(1);
      transform: rotate(360deg) scale(1);
    }
  }
</style>
