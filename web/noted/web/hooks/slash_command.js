import { safeRun } from "../../common/util.js";
import { syntaxTree } from "../deps.js";
const slashCommandRegexp = /([^\w:]|^)\/[\w\-]*/;
export class SlashCommandHook {
  constructor(editor) {
    this.slashCommands = /* @__PURE__ */ new Map();
    this.editor = editor;
  }
  buildAllCommands(system) {
    this.slashCommands.clear();
    for (const plug of system.loadedPlugs.values()) {
      for (const [name, functionDef] of Object.entries(
        plug.manifest.functions
      )) {
        if (!functionDef.slashCommand) {
          continue;
        }
        const cmd = functionDef.slashCommand;
        this.slashCommands.set(cmd.name, {
          slashCommand: cmd,
          run: () => {
            return plug.invoke(name, [cmd]);
          },
        });
      }
    }
  }
  slashCommandCompleter(ctx) {
    const prefix = ctx.matchBefore(slashCommandRegexp);
    if (!prefix) {
      return null;
    }
    const prefixText = prefix.text;
    const options = [];
    const currentNode = syntaxTree(ctx.state).resolveInner(ctx.pos);
    if (currentNode.type.name === "CommentBlock") {
      return null;
    }
    for (const def of this.slashCommands.values()) {
      options.push({
        label: def.slashCommand.name,
        detail: def.slashCommand.description,
        boost: def.slashCommand.boost,
        apply: () => {
          this.editor.editorView?.dispatch({
            changes: {
              from: prefix.from + prefixText.indexOf("/"),
              to: ctx.pos,
              insert: "",
            },
          });
          safeRun(async () => {
            await def.run();
            this.editor.focus();
          });
        },
      });
    }
    return {
      from: prefix.from + prefixText.indexOf("/") + 1,
      options,
    };
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
    const errors = [];
    for (const [name, functionDef] of Object.entries(manifest.functions)) {
      if (!functionDef.slashCommand) {
        continue;
      }
      const cmd = functionDef.slashCommand;
      if (!cmd.name) {
        errors.push(`Function ${name} has a command but no name`);
      }
    }
    return [];
  }
}
