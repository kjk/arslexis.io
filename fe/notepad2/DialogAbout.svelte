<script>
  import { focus } from "../actions/focus";
  import WinDialogBase from "../WinDialogBase.svelte";

  export let open = false;
</script>

<WinDialogBase bind:open title="Notepad2 web">
  <div
    class="bg-white px-8 py-8 flex flex-col justify-center min-h-[4rem] max-w-[480px]"
    slot="main"
  >
    <div>
      Notepad2web is a web re-implementation of <a
        class="underline"
        target="_blank"
        rel="noreferrer"
        href="https://github.com/zufuliu/notepad2">Notepad2</a
      > Windows text editor.
    </div>
    <div class="mt-1">We try to be as close to the original as possible.</div>
    <div class="mt-1">
      Using <a
        class="underline"
        target="_blank"
        rel="noreferrer"
        href="https://codemirror.net/">Code Mirror 6</a
      > for editor.
    </div>
    <div class="mt-1">
      Made by <a
        class="underline"
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
