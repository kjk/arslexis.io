import { proxySyscalls } from "../../plugos/syscalls/transport.ts";
import { storeSyscalls } from "../../plugos/syscalls/store.dexie_browser.ts";
export function clientStoreSyscalls() {
  const storeCalls = storeSyscalls("local", "localData");
  return proxySyscalls(
    ["clientStore.get", "clientStore.set", "clientStore.delete"],
    (ctx, name, ...args) => {
      return storeCalls[name.replace("clientStore.", "store.")](ctx, ...args);
    }
  );
}
