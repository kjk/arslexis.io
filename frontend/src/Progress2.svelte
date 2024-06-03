<script>
  export let msg = "";
</script>

{#if msg !== ""}
  <!-- TODO: make the size smart: remember the largest size so far to avoid flickering -->
  <div class="fixed flex justify-center bottom-2 left-0 right-0 bg-white">
    <div class="bg-yellow-200 px-4 py-1 rounded min-w-[60%] shadow-lg text-sm">
      {msg}
    </div>
  </div>
{/if}
