<script>
  import SvgTwitter from "../svg/SvgTwitter.svelte";
  import SvgArrowDown from "../svg/SvgArrowDown.svelte";

  import { gistsSummary, refreshGistsForLoggedUser } from "./store.js";
  import { tooltip } from "../actions/tooltip.js";
  import { githubUserInfo, openLoginWindow, logout } from "../github_login.js";
  import { goGistEditorHome } from "./router.js";

  export let gistid = "";
  export let onGoHome = null; // function
  export let onNewGist = null; // function
  export let showTwitter = false;

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

      <div class="dropdown-content shadow" style="top: 100%; right: 0px;">
        {#if !isHome}
          <div>
            <a href="./" on:click|preventDefault={goHome}>Home</a>
          </div>
        {/if}

        {#if onNewGist}
          <div>
            <a href="/dummy/" on:click|preventDefault={onNewGist}>New gist</a>
          </div>
        {/if}
        {#if gistid === ""}
          <div>
            <a href="/dummy" on:click|preventDefault={refreshGists}>
              Sync with GitHub gists
            </a>
          </div>
        {/if}
        <div>
          <a href="/dummy" on:click|preventDefault={doLogout}>Log out</a>
        </div>
      </div>
    </div>
  {:else}
    <div class="flex flex-row justify-end items-center">
      <a
        class="px-3 py-1 text-gray-500 hover:bg-gray-100 whitespace-nowrap"
        href="/"
        on:click|preventDefault={openLoginWindow}
        use:tooltip={"Log in to manage your gists"}
      >
        Log in with GitHub
      </a>
    </div>
  {/if}
</div>
