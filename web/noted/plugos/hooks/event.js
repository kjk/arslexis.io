import { safeRun } from "../util.js";
export class EventHook {
  constructor() {
    this.localListeners = /* @__PURE__ */ new Map();
  }
  addLocalListener(eventName, callback) {
    if (!this.localListeners.has(eventName)) {
      this.localListeners.set(eventName, []);
    }
    this.localListeners.get(eventName).push(callback);
  }
  listEvents() {
    if (!this.system) {
      throw new Error("Event hook is not initialized");
    }
    const eventNames = /* @__PURE__ */ new Set();
    for (const plug of this.system.loadedPlugs.values()) {
      for (const functionDef of Object.values(plug.manifest.functions)) {
        if (functionDef.events) {
          for (const eventName of functionDef.events) {
            eventNames.add(eventName);
          }
        }
      }
    }
    for (const eventName of this.localListeners.keys()) {
      eventNames.add(eventName);
    }
    return [...eventNames];
  }
  async dispatchEvent(eventName, data) {
    if (!this.system) {
      throw new Error("Event hook is not initialized");
    }
    const responses = [];
    for (const plug of this.system.loadedPlugs.values()) {
      for (const [name, functionDef] of Object.entries(
        plug.manifest.functions
      )) {
        if (functionDef.events && functionDef.events.includes(eventName)) {
          if (plug.canInvoke(name)) {
            const result = await plug.invoke(name, [data]);
            if (result !== void 0) {
              responses.push(result);
            }
          }
        }
      }
    }
    const localListeners = this.localListeners.get(eventName);
    if (localListeners) {
      for (const localListener of localListeners) {
        const result = await Promise.resolve(localListener(data));
        if (result) {
          responses.push(result);
        }
      }
    }
    return responses;
  }
  apply(system) {
    this.system = system;
    this.system.on({
      plugLoaded: (plug) => {
        safeRun(async () => {
          await this.dispatchEvent("plug:load", plug.name);
        });
      },
    });
  }
  validateManifest(manifest) {
    const errors = [];
    for (const [_, functionDef] of Object.entries(manifest.functions || {})) {
      if (functionDef.events && !Array.isArray(functionDef.events)) {
        errors.push("'events' key must be an array of strings");
      }
    }
    return errors;
  }
}
