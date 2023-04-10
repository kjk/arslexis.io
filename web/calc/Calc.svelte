<script>
  import { Fcal } from "fcal";
  import { len } from "../util";
  import { focus } from "../actions/focus";
  import { onMount } from "svelte";

  var defaultExpression = `# this is a comment
radius : 23
PI * radius ^ 2
PI2 * radius

log(23)

23 % of 1023

200 sec + 120 %

20 minutes + 34 day in sec

sin(PI)

E

speed = 20 kph

speed in mps

456 as hex
`;

  let expression = defaultExpression;
  let results = [];

  $: main(expression);

  function isComment(s) {
    return s.startsWith("#");
  }

  function main(input) {
    console.log("main: ", input);
    let fcalEngine = new Fcal();
    let values = input.split("\n");
    let res = [];
    for (let v of values) {
      console.log("v:", v);
      v = v.trim();
      if (len(v) == 0) {
        res.push(" ");
        continue;
      }
      if (isComment(v)) {
        res.push(v);
        continue;
      }
      try {
        let s = "" + fcalEngine.evaluate(v);
        res.push(s);
      } catch (e) {
        res.push("error: " + e.name + " " + e.message);
      }
    }
    console.log("res:", res);
    results = res;
  }

  /** @type {HTMLTextAreaElement} */
  let textarea;

  function clear() {
    expression = "";
    textarea.focus();
  }

  onMount(() => {
    textarea.focus();
  });

  function isError(s) {
    return s.startsWith("error:");
  }
</script>

<div class="h-screen flex flex-col">
  <div class="flex px-4 py-2 gap-x-2 bg-slate-200">
    <a href="/" class="underline">Home</a>
    <div>/</div>
    <div>This is a notepad-like calculator</div>
    <div class="grow" />
    <button
      on:click={clear}
      class="border border-slate-400 px-4 py-0.5 text-xs bg-white hover:bg-slate-50"
      >clear</button
    >
  </div>
  <div class="flex font-mono h-min-0 h-full">
    <textarea
      bind:value={expression}
      bind:this={textarea}
      class="w-[50%] px-4 py-1 border-none text-sm focus-visible:outline-none"
      placeholder="expression"
    />
    <div
      class="w-[50%] bg-slate-50 px-4 py-1 text-sm flex flex-col items-start"
    >
      {#each results as result}
        {#if isError(result)}
          <div class="h-[20px] text-red-400">{result}</div>
        {:else}
          <div class="h-[20px]">{result}</div>
        {/if}
      {/each}
    </div>
  </div>
</div>
