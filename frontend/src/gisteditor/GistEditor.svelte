<script>
  // import SvgReddit from "../svg/SvgReddit.svelte";
  import Messages from "../Messages.svelte";
  import HelpButton from "./HelpButton.svelte";
  import GistEditorNav from "./GistEditorNav.svelte";
  import GistLine from "./GistLine.svelte";
  import CreateGists from "./CreateGists.svelte";
  import About from "./About.svelte";
  import SelectLangDialog from "./SelectLangDialog.svelte";
  // import { tooltip } from "../actions/tooltip.js";
  import {
    gistsSummary,
    localGists,
    refreshGistsForLoggedUser,
  } from "./store.js";
  import { len, inflect } from "../util.js";
  import {
    openLoginWindow,
    githubUserInfo,
    setOnGitHubLogin,
  } from "../github_login.js";
  import { goToGistById } from "./router";

  let totalGistsCount = 0;
  let localGistsCount = 0;
  let secretGistsCount = 0;
  let showingSelectLang = false;
  let searchTerm = "";
  let filteredGists = [];

  $: totalGistsCount = len($gistsSummary) + len($localGists);
  $: localGistsCount = len($localGists);
  $: secretGistsCount = calcSecretGists($gistsSummary);
  $: $localGists, $gistsSummary, filterResults(searchTerm);
  // $: console.log("updated gists, size:", len($gistsSummary));

  $: filterResults(searchTerm);

  /**
   *
   * @param {string} term
   * @param {*} gist
   * @returns {boolean}
   */
  function gistMatches(term, gist) {
    if (term === "") {
      return true;
    }
    const desc = gist.description || "";
    if (desc.includes(term)) {
      return true;
    }
    const files = Object.keys(gist.files);
    for (let name of files) {
      if (name.includes(term)) {
        return true;
      }
    }
    return false;
  }

  /**
   * @param {string} term
   */
  function filterResults(term) {
    console.log("filterResults:", term);
    let res = [];
    for (let gist of $localGists) {
      if (gistMatches(term, gist)) {
        res.push(gist);
      }
    }
    for (let gist of $gistsSummary) {
      if (gistMatches(term, gist)) {
        res.push(gist);
      }
    }
    filteredGists = res;
  }

  /**
   * @param {any[]} gists
   * @returns {number}
   */
  function calcSecretGists(gists) {
    let n = 0;
    for (let g of gists) {
      if (!g.public) {
        n++;
      }
    }
    return n;
  }

  function onNewGist() {
    // console.log("onNewGist");
    showingSelectLang = true;
  }

  /* handle click on gist line. Start with clicked element and find
  the parent that has data-gist-id attribute to find which gist to use */
  function goToGist(ev) {
    let el = ev.target;
    while (el) {
      if (el.dataset.gistId) {
        break;
      }
      el = el.parentElement;
    }
    if (!el) {
      console.log("didn't find element with data-gist-id attribute");
      return;
    }
    const id = el.dataset.gistId;
    goToGistById(id);
  }

  function doOnGitHubLogin() {
    console.log("doOnGitHubLogin");
    // TODO: sometimes it should be false?
    refreshGistsForLoggedUser(true);
  }

  /**
   * @param {KeyboardEvent} ev
   */
  function handleInputKeyDown(ev) {
    if (ev.key === "Escape") {
      searchTerm = "";
    }
  }
  setOnGitHubLogin(doOnGitHubLogin);
</script>

<div class="flex flex-col absolute inset-0">
  <GistEditorNav {onNewGist} />

  {#if !$githubUserInfo && len($localGists) == 0}
    <div class="self-center mt-4 mb-8 shadow-md bg-white">
      <About />
    </div>
  {/if}

  {#if !$githubUserInfo && len($localGists) > 0}
    <div class="mt-4 mb-4 self-center">
      <button class="btn create-gist" on:click|preventDefault={openLoginWindow}>
        Log in with GitHub
      </button>
      to manage your
      <a href="https://gist.github.com" target="_blank" rel="noreferrer"
        >gists</a
      >
    </div>
  {/if}

  <div class="center flex flex-row items-center">
    <div class="text-sm text-gray-400 min-w31">
      {totalGistsCount}
      {inflect("gist", totalGistsCount)},
      {localGistsCount}
      local,
      {secretGistsCount}
      private
    </div>
    <CreateGists />
    <div class="min-w31"></div>
  </div>

  {#if true && totalGistsCount > 0}
    <input
      class="center border-2 border-gray-300 mt-2 px-2 py-0.5 text-xs self-center"
      bind:value={searchTerm}
      autocomplete="off"
      on:keydown={handleInputKeyDown}
    />
  {/if}

  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="overflow-x-hidden gist-line-wrapper mt-2 text-sm"
    on:click={goToGist}
  >
    {#each filteredGists as gist (gist.id)}
      <GistLine {gist} />
    {/each}
    {#if false}
      {#each $localGists as gist (gist.id)}
        <GistLine {gist} />
      {/each}
      <!-- TODO: clear $gistsSummary when logged out? -->
      {#if $githubUserInfo}
        {#each $gistsSummary as gist (gist.id)}
          <GistLine {gist} />
        {/each}
      {/if}
    {/if}
    <div class="mt-4 mb-8 border-b text-gray-500"></div>
  </div>
</div>

{#if showingSelectLang}
  <SelectLangDialog bind:open={showingSelectLang} />
{/if}

<Messages />
<HelpButton />

<style>
  .min-w31 {
    min-width: 31%;
  }

  .btn {
    margin-left: 1em;
    padding: 4px 0.75em;
    border: 1px solid rgba(27, 31, 35, 0.15);
    /* needed for safari */
    background-color: white;
    font-size: 100%;
    cursor: pointer;
  }

  /* css optimization (I hope) which generates less html.
    I was putting those on every div child but there are a lot of children
     and they are all the same. */
  :global(div.gist-line-wrapper > div) {
    display: flex;
    align-items: baseline;
    cursor: pointer;

    /* center */
    width: 95vw;
    max-width: 1024px;
    margin-left: auto;
    margin-right: auto;

    padding-top: 2px;
    padding-bottom: 2px;
  }

  :global(div.gist-line-wrapper > div:hover) {
    /* tailwind: bg-gray-100 */
    --tw-bg-opacity: 1;
    background-color: rgba(243, 244, 246, var(--tw-bg-opacity));
  }
  input {
    width: 840px !important;
  }
</style>
