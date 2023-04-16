export class CodeWidgetHook {
  constructor() {
    this.codeWidgetCallbacks = /* @__PURE__ */ new Map();
  }
  collectAllCodeWidgets(system) {
    this.codeWidgetCallbacks.clear();
    for (const plug of system.loadedPlugs.values()) {
      for (const [name, functionDef] of Object.entries(
        plug.manifest.functions
      )) {
        if (!functionDef.codeWidget) {
          continue;
        }
        this.codeWidgetCallbacks.set(functionDef.codeWidget, (bodyText) => {
          return plug.invoke(name, [bodyText]);
        });
      }
    }
  }
  apply(system) {
    this.collectAllCodeWidgets(system);
    system.on({
      plugLoaded: () => {
        this.collectAllCodeWidgets(system);
      }
    });
  }
  validateManifest(manifest) {
    const errors = [];
    for (const functionDef of Object.values(manifest.functions)) {
      if (!functionDef.codeWidget) {
        continue;
      }
      if (typeof functionDef.codeWidget !== "string") {
        errors.push(`Codewidgets require a string name.`);
      }
    }
    return errors;
  }
}
