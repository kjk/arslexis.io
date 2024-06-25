<script>
  export let gistid = "";
  export let isLocal = false;

  let gistURL = "https://gist.github.com/" + gistid;
</script>

<div class="absolute flex flex-col inset-0">
  <div
    class="flex items-center justify-between center border-b mb-2 mx-auto"
    style=""
  >
    <div class="flex font-bold text-lg">
      <a href="./" class="abtn">
        <span class="text-purple-800">Gist</span>
        <span class="text-yellow-800 ml-2">Editor</span>
      </a>
    </div>
    <!-- <div class="ml-4">
      <a
        class="abtn"
        href="https://tools.arslexis.io/docs/gist-editor"
        target="_blank"
        rel="noreferrer"
      >
        About
      </a>
    </div>
    <div class="ml-4">
      <a
        class="abtn"
        href="https://tools.arslexis.io/docs/gist-editor"
        target="_blank"
        rel="noreferrer"
      >
        Documentation
      </a>
    </div> -->
    <!--
    <div class="ml-4">
      <a class="abtn" href="https://reddit.com/r/CodeEvalApp/" target="_blank">
        Support
      </a>
    </div>
    -->
  </div>

  <div class="w-max mt-8 self-center text-xl py-4 px-8 shadow-md">
    {#if isLocal}
      Local gist
      <span class="tc2">{gistid}</span>
      doesn't exist.
    {:else}
      Gist
      <a href={gistURL} target="_blank" rel="noreferrer">{gistURL}</a>
      doesn't exist.
    {/if}
  </div>
</div>

<style>
  .center {
    width: 90vw;
    max-width: 960px;
  }
  .abtn {
    color: rgb(48, 45, 45);
    padding: 4px 12px;
  }
  .abtn:hover {
    background-color: #f3f3f3;
  }
</style>
