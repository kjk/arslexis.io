<script lang="ts">
  import WinDialogBase from "../WinDialogBase.svelte";
  import { focus } from "../actions/focus";
  import * as m from "./menu-notepad2";

  export let open = false;
  /** @type {Function} */
  export let onDone;
  let title = "Select Scheme";

  let selected;

  let entries = [
    ["Text File", m.IDM_LEXER_TEXTFILE],
    // ["2nd Text File", m.IDM_LEXER_2NDTEXTFILE],

    // ["Favorite Schemes", true],
    ["ActionScript", m.IDM_LEXER_ACTIONSCRIPT],
    ["Bash", m.IDM_LEXER_BASH],
    ["CShell", m.IDM_LEXER_CSHELL],
    ["C/C++ Source", m.IDM_LEXER_CPP],
    ["C# Source", m.IDM_LEXER_CSHARP],
    ["CSS Style Sheet", m.IDM_LEXER_CSS],
    ["Diff", m.IDM_LEXER_DIFF],
    ["Go Source", m.IDM_LEXER_GO],
    ["HTML Source", m.IDM_LEXER_HTML],
    ["JavaScript Source", m.IDM_LEXER_JS],
    ["Java Source", m.IDM_LEXER_JAVA],
    ["JSON Document", m.IDM_LEXER_JSON],
    ["LESS Source", m.IDM_LEXER_LESS],
    ["Lua Source", m.IDM_LEXER_LUA],
    ["M4", m.IDM_LEXER_M4],
    ["Markdown Document", m.IDM_LEXER_MARKDOWN],
    ["Matlab", m.IDM_LEXER_MATLAB],
    ["Octave", m.IDM_LEXER_OCTAVE],
    ["PHP Script", m.IDM_LEXER_PHP],
    ["Python Script", m.IDM_LEXER_PYTHON],
    ["Ruby Script", m.IDM_LEXER_RUBY],
    ["Rust Source", m.IDM_LEXER_RUST],
    ["SciLab", m.IDM_LEXER_SCILAB],
    ["SCSS Source", m.IDM_LEXER_SCSS],
    ["SQL Query", m.IDM_LEXER_SQL],
    ["Svelte Source", m.IDM_LEXER_SVELTE],
    ["Vue Source", m.IDM_LEXER_VUE],
    ["Web Source Code", m.IDM_LEXER_HTML],
    ["XML Document", m.IDM_LEXER_XML],

    // ["A", true],
    // ["ABAQUS"]
    // ["Android Smail"]
    //["Assembler Source"]
    //[Asymptote Code"]
    //["AutoHotkey Script"],
    //["Autoit3 Script"]
    //AviSynth Scritp
    //"Awk"
  ];

  let btnOkDisabled = true;
  $: btnOkDisabled = !selected;

  function clicked(e) {
    console.log("clicked:", e);
    selected = e;
  }

  function dblClicked(e) {
    console.log("dblClicked:", e);
    open = false;
    onDone(e[1]);
  }

  function okClicked() {
    console.log("okClicked:", selected);
    if (!selected) {
      return;
    }
    open = false;
    onDone(selected[1]);
  }

  function close() {
    open = false;
    onDone(null);
  }
</script>

<WinDialogBase bind:open onClose={close} {title}>
  <div slot="main" class="bg-white pt-2 pb-4 flex flex-col min-h-[4rem]">
    <div
      class="flex mx-4 px-2 py-2 flex-col overflow-auto border-2 mt-2 cursor-pointer min-h-[24rem] max-h-[80vh] select-none"
      tabindex="0"
      role="listbox"
    >
      {#each entries as e (e[0])}
        {@const name = e[0]}
        <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
        {#if e === selected}
          <div
            class="bg-gray-100 hover:bg-gray-200"
            on:dblclick={() => dblClicked(e)}
            on:click={() => clicked(e)}
          >
            {name}
          </div>
        {:else}
          <div
            class="hover:bg-gray-200"
            on:dblclick={() => dblClicked(e)}
            on:click={() => clicked(e)}
          >
            {name}
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- bottom -->
  <div slot="bottom" class="flex textselect-none">
    <div class="grow"></div>
    <button
      disabled={btnOkDisabled}
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded-xs min-w-[5rem] bg-white hover:border-blue-500 disabled:text-gray-200 disabled:border-0 disabled:bg-white"
      on:click={okClicked}>Ok</button
    >
    <button
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded-xs min-w-[5rem] bg-white hover:border-blue-500"
      use:focus
      on:click={close}>Cancel</button
    >
  </div>
</WinDialogBase>
