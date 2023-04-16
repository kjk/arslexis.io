import { proxySyscalls } from "../../plugos/syscalls/transport.js";
export function storeSyscalls(space) {
  return proxySyscalls(
    [
      "store.queryPrefix",
      "store.get",
      "store.has",
      "store.set",
      "store.batchSet",
      "store.delete",
      "store.deletePrefix",
    ],
    (ctx, name, ...args) => space.proxySyscall(ctx.plug, name, args)
  );
}
