import { EventEmitter } from "../../plugos/event.js";
export class CommandHook extends EventEmitter {
  constructor() {
    super(...arguments);
    this.editorCommands = /* @__PURE__ */ new Map();
  }
  buildAllCommands(system) {
    this.editorCommands.clear();
    for (let plug of system.loadedPlugs.values()) {
      for (const [name, functionDef] of Object.entries(
        plug.manifest.functions
      )) {
        if (!functionDef.command) {
          continue;
        }
        const cmd = functionDef.command;
        this.editorCommands.set(cmd.name, {
          command: cmd,
          run: () => {
            return plug.invoke(name, [cmd]);
          },
        });
      }
    }
    this.emit("commandsUpdated", this.editorCommands);
  }
  apply(system) {
    this.buildAllCommands(system);
    system.on({
      plugLoaded: () => {
        this.buildAllCommands(system);
      },
    });
  }
  validateManifest(manifest) {
    let errors = [];
    for (const [name, functionDef] of Object.entries(manifest.functions)) {
      if (!functionDef.command) {
        continue;
      }
      const cmd = functionDef.command;
      if (!cmd.name) {
        errors.push(`Function ${name} has a command but no name`);
      }
    }
    return [];
  }
}
