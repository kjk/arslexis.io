<svelte:options runes={true} />

<script>
  import SvgTwitter from "../svg/SvgTwitter.svelte";
  import SvgArrowDown from "../svg/SvgArrowDown.svelte";

  import { gistsSummary, refreshGistsForLoggedUser } from "./store.js";
  import { tooltip } from "../actions/tooltip.js";
  import { githubUserInfo, openLoginWindow, logout } from "../github_login.js";
  import { goGistEditorHome } from "./router.js";

  /** @type {{
   gistid?: string,
   onGoHome?: () => void,
   onNewGist?: () => void,
   showTwitter?: boolean,
  }}*/
  let {
    gistid = "",
    onGoHome = null,
    onNewGist = null,
    showTwitter = false,
  } = $props();

  const loc = window.location.pathname;
  let isHome = loc === "/gisteditor/";

  async function refreshGists(ev) {
    let n = ev.target;
    n = n.parentElement;
    n = n.parentElement;
    console.log(n);
    n.style.display = "none;";
    refreshGistsForLoggedUser(true);
  }

  function goHome() {
    if (onGoHome) {
      onGoHome();
      return;
    }
    goGistEditorHome();
  }

  function doLogout() {
    logout();
    // deleteGistsForLoggedUser();
    gistsSummary.set([]);
  }
</script>

<div class="flex flex-row items-center">
  {#if showTwitter}
    <a
      href="https://twitter.com/kjk"
      target="_blank"
      rel="noreferrer"
      class="px-2 py-2 text-gray-500 hover:bg-gray-100"
      use:tooltip={"Follow me on Twitter"}
    >
      <SvgTwitter style="width: 16px; height: 16px" />
    </a>
  {/if}

  {#if $githubUserInfo}
    <div class="dropdown flex flex-row justify-end items-center ml-0">
      <img
        class="avatar mr-2 mt-1"
        src={$githubUserInfo.avatar_url}
        width="20"
        height="20"
        alt={$githubUserInfo.login}
      />
      <div>{$githubUserInfo.login}</div>
      <div class="mt-1 pl-2 text-gray-700">
        <SvgArrowDown style="width: 8px; height: 8px" />
      </div>

      <div
        class="dropdown-content flex flex-col items-start shadow top-full right-0"
      >
        {#if !isHome}
          <button onclick={goHome}>Home</button>
        {/if}

        {#if onNewGist}
          <button onclick={onNewGist}>New gist</button>
        {/if}
        {#if gistid === ""}
          <button onclick={refreshGists}>Sync with GitHub gists</button>
        {/if}
        <button onclick={doLogout}>Log out</button>
      </div>
    </div>
  {:else}
    <div class="flex flex-row justify-end items-center">
      <button
        onclick={openLoginWindow}
        use:tooltip={"Log in to manage your gists"}
      >
        Log in with GitHub
      </button>
    </div>
  {/if}
</div>
