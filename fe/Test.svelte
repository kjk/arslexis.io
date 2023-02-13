<script>
  import Spinners from "./Spinners.svelte";
  import MenuBar from "./MenuBar.svelte";
  import { mainMenuBar } from "./menu-notepadpp.js";

  function handleMenuCmd(cmd) {
    // console.log("handleMenuCmd:", cmd.detail);
    let el = document.activeElement;
    if (el) {
      // console.log("active element:", el);
      /** @type {HTMLElement}*/ (el).blur();
    }
  }
</script>

<div class="mb-4">
  <a class="underline" href="/">Home</a> : This is a test page
</div>

<details>
  <summary>spinners</summary>
  <div>Spinners rotate</div>
  <Spinners kind="rotate" />

  <div>Spinners 3dot</div>
  <Spinners kind="3dot" />

  <div>Spinners spin</div>
  <Spinners kind="spin" />

  <div>Spinners spin-portion</div>
  <Spinners kind="spin-portion" />

  <div>Spinners 3dot-inverse</div>
  <Spinners kind="3dot-inverse" />

  <div>Spinners double-spin</div>
  <Spinners kind="double-spin" />

  <div>Spinners scale/pulse</div>
  <Spinners kind="scale/pulse" />

  <div>Spinners grid-fade</div>
  <Spinners kind="grid-fade" />

  <div>Spinners perspective</div>
  <Spinners kind="perspective" />

  <div>Spinners classic-spin</div>
  <Spinners kind="classic-spin" />

  <div>Spinners classic-fadein</div>
  <Spinners kind="classic-fadein" />
</details>

<details open>
  <summary>Menu test</summary>
  <!-- svelte-ignore a11y-invalid-attribute -->
  <MenuBar menuBar={mainMenuBar} on:menucmd={handleMenuCmd} />
</details>
