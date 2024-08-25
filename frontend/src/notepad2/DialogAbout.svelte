<script>
  import WinDialogBase from "../WinDialogBase.svelte";

  import { noOp } from "../util";
  import { focus } from "../actions/focus";

  export let open = false;
</script>

<WinDialogBase onClose={noOp} bind:open title="Notepad2 web">
  <div
    class="bg-white px-8 py-8 flex flex-col justify-center min-h-[4rem] max-w-[480px]"
    slot="main"
  >
    <div>
      <b>Notepad2web</b> is a web re-implementation of
      <a
        class="underline focus-within:outline"
        target="_blank"
        rel="noreferrer"
        href="https://github.com/zufuliu/notepad2">Notepad2</a
      > Windows text editor.
    </div>
    <div class="mt-1">Trying to be as close to the original as possible.</div>
    <div class="mt-1">You can:</div>
    <!-- <a
      class="ml-2 underline focus-within:outline"
      rel="noreferrer"
      target="_blank"
      href="https://arslexis.io/docs/notepad2">read documentation</a
    > -->
    <a
      class="ml-2 underline focus-within:outline"
      rel="noreferrer"
      target="_blank"
      href="https://github.com/kjk/tools.arslexis.io/issues"
      >report bugs, request features</a
    >
    <a
      class="ml-2 underline focus-within:outline"
      rel="noreferrer"
      target="_blank"
      href="https://twitter.com/kjk">follow me on Twitter</a
    >
    <a
      class="ml-2 underline focus-within:outline"
      rel="noreferrer"
      target="_blank"
      href="https://github.com/kjk/tools.arslexis.io">see source code</a
    >

    <div class="mt-1">Credits:</div>
    <div class="ml-2">
      <a
        class="underline focus-within:outline"
        target="_blank"
        rel="noreferrer"
        href="https://github.com/zufuliu/notepad2">Notepad2</a
      > the original.
    </div>
    <div class="ml-2">
      <a
        class="underline focus-within:outline"
        target="_blank"
        rel="noreferrer"
        href="https://svelte.dev/">Svelte</a
      > framework
    </div>
    <div class="ml-2">
      <a
        class="underline focus-within:outline"
        target="_blank"
        rel="noreferrer"
        href="https://codemirror.net/">Code Mirror 6</a
      >
      for editor component
    </div>

    <div class="mt-1">
      Made by <a
        class="underline focus-within:outline"
        target="_blank"
        rel="noreferrer"
        href="https://blog.kowalczyk.info">Krzysztof Kowalczyk</a
      >
    </div>
  </div>

  <!-- bottom -->
  <div slot="bottom" class="flex justify-end text-xs select-none">
    <button
      use:focus
      class="btn-dlg ml-4 px-4 py-0.5 hover:bg-blue-50 border border-gray-400 rounded min-w-[5rem] bg-white hover:border-blue-500"
      on:click={() => {
        open = false;
      }}>Ok</button
    >
  </div>
</WinDialogBase>
