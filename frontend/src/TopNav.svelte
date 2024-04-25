<script>
  import SvgHome from "./svg/SvgHome.svelte";
  import Twitter from "./icons/Twitter.svelte";
  import GitHub from "./icons/GitHub.svelte";

  export let gitHubURL = "https://github.com/kjk/tools.arslexis.io";
</script>

<div class="flex items-center mx-4 pt-1 pb-2">
  <div class="flex text-lg items-center">
    <a class="px-1 py-1 mr-1 hover:bg-gray-100" href="/">
      <SvgHome />
    </a>
    <div class="mr-2">/</div>
    <slot />
  </div>
  <div class="grow" />
  <a
    class="px-1 py-1 mr-1 hover:underline text-xs"
    href="https://github.com/kjk/tools.arslexis.io/discussions"
    target="_blank"
    rel="noreferrer"
  >
    feedback
  </a>

  <a
    class="px-1 py-1 mr-1 hover:bg-gray-100"
    href={gitHubURL}
    target="_blank"
    rel="noreferrer"
  >
    <GitHub />
  </a>
  <a
    class="px-1 py-1 mr-2 hover:bg-gray-100"
    href="https://twitter.com/kjk"
    target="_blank"
    rel="noreferrer"
  >
    <Twitter />
  </a>
  <a
    class="mr-1 hover:bg-gray-100"
    href="https://blog.kowalczyk.info"
    target="_blank"
    rel="noreferrer"
  >
    <img
      src="https://avatars.githubusercontent.com/u/7935?v=4"
      width="20"
      height="20"
      alt="kjk"
    />
  </a>
</div>
