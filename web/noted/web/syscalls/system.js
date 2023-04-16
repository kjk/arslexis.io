export function systemSyscalls(editor, system) {
  return {
    "system.invokeFunction": (ctx, env, name, ...args) => {
      if (!ctx.plug) {
        throw Error("No plug associated with context");
      }
      let plug = ctx.plug;
      if (name.indexOf(".") !== -1) {
        const [plugName, functionName] = name.split(".");
        plug = system.loadedPlugs.get(plugName);
        if (!plug) {
          throw Error(`Plug ${plugName} not found`);
        }
        name = functionName;
      }
      if (env === "client") {
        return plug.invoke(name, args);
      }
      return editor.space.invokeFunction(plug, env, name, args);
    },
    "system.invokeCommand": (ctx, name) => {
      return editor.runCommandByName(name);
    },
    "system.listCommands": () => {
      const allCommands = {};
      for (let [cmd, def] of editor.commandHook.editorCommands) {
        allCommands[cmd] = def.command;
      }
      return allCommands;
    },
    "system.reloadPlugs": () => {
      return editor.reloadPlugs();
    },
    "sandbox.getServerLogs": (ctx) => {
      return editor.space.proxySyscall(ctx.plug, "sandbox.getLogs", []);
    },
    "system.getEnv": () => {
      return system.env;
    }
  };
}
