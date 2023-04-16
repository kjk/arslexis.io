import { proxySyscalls } from "../../plugos/syscalls/transport.js";
import { storeSyscalls } from "../../plugos/syscalls/store.dexie_browser.js";
export function clientStoreSyscalls() {
  const storeCalls = storeSyscalls("local", "localData");
  return proxySyscalls(
    ["clientStore.get", "clientStore.set", "clientStore.delete"],
    (ctx, name, ...args) => {
      return storeCalls[name.replace("clientStore.", "store.")](ctx, ...args);
    }
  );
}
