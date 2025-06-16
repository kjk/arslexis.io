<svelte:options runes={true} />

<script>
  import SvgHome from "../svg/SvgHome.svelte";
  import Login from "./Login.svelte";
  import Overlay from "../Overlay.svelte";
  import About from "./About.svelte";
  import { positionModal } from "../actions/positionnode";
  import { tooltip } from "../actions/tooltip";

  /** @type {Function} */

  /** @type {{
   onNewGist: () => void,
  }} */
  let { onNewGist } = $props();

  let showingAbout = $state(false);

  // <div class="about-dialog fixed flex flex-col bg-white border shadow-md" />
</script>

<div
  class="flex items-center mb-2 pt-1 pb-2 justify-between center text-gray-500"
>
  <div class="flex font-bold text-lg items-center">
    <a class="px-1 py-1 mr-1 hover:bg-gray-100" href="/">
      <SvgHome />
    </a>
    <div class="mr-2">/</div>
    <span class="text-purple-800">Gist</span>
    <span class="text-yellow-800 ml-2">Editor</span>
    <!-- <button
      class="mr-4 ml-4 font-normal px-2 py-1 hover:bg-gray-100 self-center"
      use:tooltip={"Create new text gist"}>New Gist</button
    > -->
  </div>

  <button
    class="ml-8 px-3 py-1 hover:bg-gray-100"
    onclick={() => (showingAbout = !showingAbout)}
  >
    About
  </button>
  <!-- <a
    class="px-3 py-1 hover:bg-gray-100"
    href="https://arslexis.io/docs/gist-editor"
    target="_blank"
    rel="noreferrer"
  >
    Documentation
  </a> -->
  <!--
<div>
  <a
    class="flex items-center px-3 py-1 hover:bg-gray-100"
    href="https://reddit.com/r/CodeEvalApp/"
    use:tooltip={'Questions, feedback, bug reports'}
    target="_blank">
    Support
    <div class="ml-2">
      <SvgReddit style="width: 16px; height: 16px" />
    </div>
  </a>
</div>
-->
  <Login {onNewGist} />
</div>

{#if showingAbout}
  <Overlay bind:open={showingAbout}>
    <div class="absolute" use:positionModal>
      <About />
    </div>
  </Overlay>
{/if}
