import { proxySyscalls } from "../../plugos/syscalls/transport.js";
export function fulltextSyscalls(space) {
  return proxySyscalls(
    ["fulltext.search", "fulltext.delete", "fulltext.index"],
    (ctx, name, ...args) => space.proxySyscall(ctx.plug, name, args)
  );
}
