<script>
  import Close from "../icons/Close.svelte";
  import { draggable } from "@neodrag/svelte";
  import { positionModal } from "../actions/positionnode";
  import { focus } from "../actions/focus";

  export let open = false;

  let title = "Find Text";
  let dragHandle = null;

  let matchCase = false;
  let dontWrapAraound = false;
  let matchWholeWord = true;
  let closeAfterFind = false;
  let matchWordBeg = false;
  let wildcardSearch = false;
  let regexpSearch = false;
  let bookmarkMatchedLine = false;
  let transformBackslashed = false;
  let useMonospacedFont = false;
  let transparentModeOnLosingFocus = false;

  /**
   * @param {KeyboardEvent} ev
   */
  function handleInputKeyDown(ev) {
    // we want the user to be able to input enter
    if (ev.key === "Enter") {
    }
  }

  function close() {
    open = false;
    // onDone(null, null);
  }
</script>

{#if open}
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    role="dialog"
    class="absolute w-fit min-w-[360px] shadow-xl shadow-md bg-white flex flex-col text-black text-xs"
    use:draggable={{ handle: dragHandle }}
    use:positionModal
  >
    <!-- title area -->
    <div
      class="flex items-center bg-blue-50 py-0.5 cursor-grab"
      bind:this={dragHandle}
    >
      <div class="grow ml-2">
        {title}
      </div>
      <button
        class="btn-dlg hover:bg-blue-200 mr-2 text-gray-700"
        on:click={close}
      >
        <Close size={20} />
      </button>
    </div>

    <div class="flex flex-row mx-4 my-2">
      <div class="gr">
        <div>Search String:</div>
        <button class="underline text-right mb-1">Clear History</button>
        <input
          use:focus
          type=""
          class="col-span-2 border border-black mb-2 px-2 py-1"
        />

        <label
          ><input type="checkbox" bind:checked={matchCase} />Match case</label
        >

        <label
          ><input type="checkbox" bind:checked={dontWrapAraound} />Dont wrap
          around</label
        >

        <label
          ><input type="checkbox" bind:checked={matchWholeWord} />Match whole
          word</label
        >

        <label
          ><input type="checkbox" bind:checked={closeAfterFind} />Close after
          find</label
        >

        <label
          ><input type="checkbox" bind:checked={matchWordBeg} />Match beginning
          of word only</label
        >

        <label
          ><input type="checkbox" bind:checked={wildcardSearch} />Wildcard
          search (?)</label
        >

        <label
          ><input type="checkbox" bind:checked={regexpSearch} />Regular
          expression search</label
        >

        <label
          ><input type="checkbox" bind:checked={bookmarkMatchedLine} />Bookmark
          matched line</label
        >

        <label>
          <input type="checkbox" bind:checked={transformBackslashed} />Transform
          backlashes</label
        >

        <label
          ><input type="checkbox" bind:checked={useMonospacedFont} />Use
          monospaced font</label
        >

        <label
          ><input
            type="checkbox"
            bind:checked={transparentModeOnLosingFocus}
          />Transparent mode on losing focus</label
        >

        <button class="underline">Goto Replace (Ctrl-H)</button>
      </div>
      <div class="flex flex-col ml-4">
        <div class="flex flex-col">
          <button class="border px-2 py-1 hover:bg-gray-50">Find Next</button>
          <button class="border px-2 py-1 mt-2 hover:bg-gray-50"
            >Find Previous</button
          >
          <button class="border px-2 py-1 mt-2 hover:bg-gray-50"
            >Find All</button
          >
          <button class="border px-2 py-1 mt-2 hover:bg-gray-50"
            >Select All</button
          >
        </div>
        <div class="grow min-h-[1rem]" />
        <button class="underline self-start">Save Position</button>
        <button class="underline self-start">Reset Position</button>
      </div>
    </div>
  </div>
{/if}

<style>
  label {
    display: inline-block;
    white-space: nowrap;
  }
  input {
    vertical-align: middle;
    margin-top: -3px;
    margin-right: 4px;
  }

  .gr {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 2rem;
    row-gap: 0.25rem;
  }
  /* :focus-within is not set by focus() so we normalize the style
  of :focus and :focus-with of buttons inside dialogs */
  :global(.btn-dlg:focus) {
    outline-color: blue;
    outline-style: solid;
    outline-width: 2px;
  }
  :global(.btn-dlg:ocus-within) {
    outline-color: blue;
    outline-style: solid;
    outline-width: 2px;
  }
</style>
