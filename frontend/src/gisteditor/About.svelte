<script>
  import { openLoginWindow } from "../github_login.js";
</script>

<div class="bg-white px-8 py-4">
  <div class="flex flex-row justify-center font-bold">
    Welcome to&nbsp;
    <span class="text-purple-800">Gist</span>
    <span class="text-yellow-800 ml-2">Editor</span>
    !
  </div>
  <div>
    <div class="flex flex-row">
      <span class="text-purple-800 font-bold">Gist</span>
      <span class="text-yellow-800 font-bold ml-2">Editor</span>
      &nbsp;is:
    </div>
    <ul class="ml-4">
      <li>
        notepad for notes and code snippets, stored locally in the browser
      </li>
      <li>
        GitHub gist manager, if you
        <a class="underline" href="/" on:click|preventDefault={openLoginWindow}>
          log in with GitHub
        </a>
      </li>
    </ul>
  </div>
  <div class="flex justify-end mt-2">
    <a
      class="btn abtn"
      href="https://tools.arslexis.io/docs/gist-editor"
      target="_blank"
      rel="noreferrer"
    >
      Learn more
    </a>
  </div>
</div>

<style>
  .abtn {
    color: rgb(48, 45, 45);
    padding: 4px 12px;
  }
  .abtn:hover {
    background-color: #f3f3f3;
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
  .btn:hover {
    background-color: #f3f3f3;
  }
  li {
    list-style: square;
  }
</style>
