<script lang="ts">
  let { msgHTML = "" } = $props();
</script>

{#if msgHTML !== ""}
  <!-- TODO: make the size smart: remember the largest size so far to avoid flickering -->
  <div class="fixed flex justify-center bottom-2 left-0 right-0 bg-white">
    <div
      class="bg-yellow-200 px-4 py-1 rounded-xs min-w-[60%] max-w-[90%] shadow-lg text-sm"
    >
      {@html msgHTML}
    </div>
  </div>
{/if}
