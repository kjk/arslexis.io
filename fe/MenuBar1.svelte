<script>
  import Menu from "./Menu1.svelte";

  export let menu;
</script>

<div class="flex flex-row bg-gray-50 px-2 relative">
  {#each menu as menu}
    <Menu {menu} />
  {/each}
</div>

<style>
</style>
