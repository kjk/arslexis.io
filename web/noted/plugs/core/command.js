import { system } from "$sb/silverbullet-syscall/mod.js";
export async function commandComplete(completeEvent) {
  const match = /\{\[([^\]]*)$/.exec(completeEvent.linePrefix);
  if (!match) {
    return null;
  }
  const allCommands = await system.listCommands();
  return {
    from: completeEvent.pos - match[1].length,
    options: Object.keys(allCommands).map((commandName) => ({
      label: commandName,
      type: "command",
    })),
  };
}
