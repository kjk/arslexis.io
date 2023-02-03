<script>
  export let menu; // array of menu items

  const menuDiv = "---";

  let isOpened = false;

  function fixMenuName(s) {
    return s.replace("&", "");
  }

  function toggleOpened() {
    isOpened = !isOpened;
  }

  function eatClick(ev) {
    console.log("eat:", ev);
    ev.preventDefault();
    ev.stopPropagation();
  }

  function menuClicked(mi) {
    console.log(mi);
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="mr-2 hover:bg-gray-300 cursor-pointer" on:click={toggleOpened}>
  {fixMenuName(menu[0])}
  {#if isOpened}
    <div
      class="table absolute flex flex-col bg-white px-2 py-2 border-2 z-40 text-sm"
    >
      {#each menu[1] as mi}
        {#if mi === menuDiv}
          <div class="table-row mt-2 mb-2">
            <hr class="table-cell" on:click={eatClick} />
            <hr class="table-cell" on:click={eatClick} />
          </div>
        {:else}
          <div
            class="table-row hover:bg-gray-100"
            on:click={() => menuClicked(mi)}
          >
            <div class="table-cell">{mi[0]}</div>
            <div class="table-cell pl-4 pr-2 text-gray-500">{mi[2] || " "}</div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
</style>
