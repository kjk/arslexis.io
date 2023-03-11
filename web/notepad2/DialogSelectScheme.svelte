<script>
  import WinDialogBase from "../WinDialogBase.svelte";
  import { onMount } from "svelte";
  import { focus } from "../actions/focus";
  import * as m from "./menu-notepad2";

  export let open = false;
  /** @type {Function} */
  export let onDone;
  let title = "Select Scheme";

  let selectedIdx;

  let entries = [
    ["Text File", m.IDM_LEXER_TEXTFILE],
    ["2nd Text File", m.IDM_LEXER_2NDTEXTFILE],

    // ["Favorite Schemes", true],
    ["C/C++ Source", m.IDM_LEXER_CPP],
    ["C# Source", m.IDM_LEXER_CSHARP],
    ["CSS Style Sheet", m.IDM_LEXER_CSS],
    ["Java Source", m.IDM_LEXER_JAVA],
    ["JSON Document", m.IDM_LEXER_JSON],
    ["PHP Script", m.IDM_LEXER_PHP],
    ["Python Script", m.IDM_LEXER_PYTHON],
    ["Ruby Script", m.IDM_LEXER_RUBY],
    ["SQL Query", m.IDM_LEXER_SQL],
    ["Web Source Code", m.IDM_LEXER_HTML],
    ["XML Document", m.IDM_LEXER_XML],

    ["A", true],
    // ["ABAQUS"]
    ["ActionScript", m.IDM_LEXER_ACTIONSCRIPT],
    // ["Android Smail"]
    //["Assembler Source"]
    //[Asymptote Code"]
    //["AutoHotkey Script"],
    //["Autoit3 Script"]
    //AviSynth Scritp
    //"Awk"
  ];

  onMount(() => {
    console.log("onMount");
  });

  let btnOkDisabled = false;
  function btnOkClicked() {
    console.log("btnOkClicked");
    onDone(selectedIdx);
  }
</script>

<WinDialogBase bind:open {title}>
  <div slot="main" class="bg-white pt-2 pb-4 flex flex-col min-h-[4rem]">
    <div
      class="flex mx-4 px-2 py-2 flex-col overflow-auto border-2 mt-2 cursor-pointer min-h-[12rem] max-h-[8rem]"
      tabindex="0"
      role="listbox"
    />
  </div>

  <!-- bottom -->
  <div slot="bottom" class="flex textselect-none">
    <div class="grow" />
    <button
      disabled={btnOkDisabled}
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500 disabled:text-gray-200 disabled:border-0 disabled:bg-white"
      on:click={btnOkClicked}>Ok</button
    >
    <button
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      use:focus
      on:click={close}>Cancel</button
    >
  </div>
</WinDialogBase>
