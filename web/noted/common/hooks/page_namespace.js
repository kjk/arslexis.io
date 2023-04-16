export class PageNamespaceHook {
  constructor() {
    this.spaceFunctions = [];
  }
  apply(system) {
    system.on({
      plugLoaded: () => {
        this.updateCache(system);
      },
      plugUnloaded: () => {
        this.updateCache(system);
      }
    });
  }
  updateCache(system) {
    this.spaceFunctions = [];
    for (const plug of system.loadedPlugs.values()) {
      if (plug.manifest?.functions) {
        for (const [funcName, funcDef] of Object.entries(
          plug.manifest.functions
        )) {
          if (funcDef.pageNamespace) {
            this.spaceFunctions.push({
              operation: funcDef.pageNamespace.operation,
              pattern: new RegExp(funcDef.pageNamespace.pattern),
              plug,
              name: funcName,
              env: funcDef.env
            });
          }
        }
      }
    }
  }
  validateManifest(manifest) {
    const errors = [];
    if (!manifest.functions) {
      return [];
    }
    for (let [funcName, funcDef] of Object.entries(manifest.functions)) {
      if (funcDef.pageNamespace) {
        if (!funcDef.pageNamespace.pattern) {
          errors.push(`Function ${funcName} has a namespace but no pattern`);
        }
        if (!funcDef.pageNamespace.operation) {
          errors.push(`Function ${funcName} has a namespace but no operation`);
        }
        if (![
          "readFile",
          "writeFile",
          "getFileMeta",
          "listFiles",
          "deleteFile"
        ].includes(funcDef.pageNamespace.operation)) {
          errors.push(
            `Function ${funcName} has an invalid operation ${funcDef.pageNamespace.operation}`
          );
        }
      }
    }
    return errors;
  }
}
