<script context="module">
  import { writable, get } from "svelte/store";
  let msgId = 1;
  export const infoMessages = writable([]);
  export const errorMessages = writable([]);

  function addMessage(msgStore, msg, timeoutMs) {
    let msgs = get(msgStore);
    let thisMsgId = msgId;
    msgId++;
    const a = [msg, thisMsgId];
    msgs.push(a);
    msgStore.set(msgs);
    function removeMessage() {
      msgs = get(msgStore);
      let msgsNew = [];
      for (let el of msgs) {
        if (el[1] !== thisMsgId) {
          msgsNew.push(el);
        }
      }
      msgStore.set(msgsNew);
    }
    window.setTimeout(removeMessage, timeoutMs);
  }

  export function showInfoMessage(msg, timeoutMs = 3000) {
    addMessage(infoMessages, msg, timeoutMs);
  }

  export function showMessage(msg, timeoutMs = 3000) {
    addMessage(infoMessages, msg, timeoutMs);
  }

  export function clearMessage() {
    infoMessages.set([]);
  }

  export function showErrorMessage(msg, timeoutMs = 3000) {
    addMessage(errorMessages, msg, timeoutMs);
  }

  export function showError(msg, timeoutMs = 3000) {
    addMessage(errorMessages, msg, timeoutMs);
  }

  window.onerror = function (msg, src, lineno, colno, error) {
    this.console.log("err");
    //console.log("captured the error");
    showError(msg, 10000);
    // pass it further along to default event handler
  };

  window.addEventListener("error", function (ev) {
    // TODO: more
    showError("errr", 10000);
  });

  window.addEventListener("unhandledrejection", function (ev) {
    // TODO: more
    showError("unhandled rejection", 10000);
  });

  // @ts-ignore
  window.showMessage = showInfoMessage;
  // @ts-ignore
  window.showError = showErrorMessage;
</script>

<style>
  .msg {
    max-width: 90vw;
    min-width: 14rem;
  }

  .err-msg {
    border: 1px solid #a0a0a0;
    border-left: 6px solid red;
    background-color: lightgoldenrodyellow;
  }

  .info-msg {
    background-color: #fafafa;
    border: 1px solid #a0a0a0;
    border-left: 6px solid saddlebrown;
  }
</style>

<div class="flex flex-col justify-around fixed left-0 right-0 bottom-2 z-50">
  {#each $infoMessages as msg}
    <div class="msg info-msg mt-2 py-2 px-4 self-center">{msg[0]}</div>
  {/each}

  {#each $errorMessages as msg}
  <div class="msg err-msg mt-2 py-2 px-4 flex self-center">
    <div class="font-bold text-red-500">{msg[0]}</div>
    <!-- <div class="ml-4 text-black cursor-pointer hover:text-gray-600">close</div> -->
  </div>
  {/each}
</div>
