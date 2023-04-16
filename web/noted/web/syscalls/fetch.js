import { proxySyscalls } from "../../plugos/syscalls/transport.js";
export function sandboxFetchSyscalls(space) {
  return proxySyscalls(["sandboxFetch.fetch"], (ctx, name, ...args) =>
    space.proxySyscall(ctx.plug, name, args)
  );
}
