import { proxySyscalls } from "../../plugos/syscalls/transport.js";
export function indexerSyscalls(space) {
  return proxySyscalls(
    [
      "index.queryPrefix",
      "index.get",
      "index.set",
      "index.batchSet",
      "index.delete",
    ],
    (ctx, name, ...args) => space.proxySyscall(ctx.plug, name, args)
  );
}
