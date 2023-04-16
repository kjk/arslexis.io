import { EventEmitter } from "./event.js";
import { Plug } from "./plug.js";
export class System extends EventEmitter {
  constructor(env) {
    super();
    this.env = env;
    this.plugs = /* @__PURE__ */ new Map();
    this.registeredSyscalls = /* @__PURE__ */ new Map();
    this.enabledHooks = /* @__PURE__ */ new Set();
  }
  get loadedPlugs() {
    return this.plugs;
  }
  addHook(feature) {
    this.enabledHooks.add(feature);
    feature.apply(this);
  }
  registerSyscalls(requiredCapabilities, ...registrationObjects) {
    for (const registrationObject of registrationObjects) {
      for (const [name, callback] of Object.entries(registrationObject)) {
        this.registeredSyscalls.set(name, {
          requiredPermissions: requiredCapabilities,
          callback,
        });
      }
    }
  }
  syscallWithContext(ctx, name, args) {
    const syscall = this.registeredSyscalls.get(name);
    if (!syscall) {
      throw Error(`Unregistered syscall ${name}`);
    }
    for (const permission of syscall.requiredPermissions) {
      if (!ctx.plug) {
        throw Error(`Syscall ${name} requires permission and no plug is set`);
      }
      if (!ctx.plug.grantedPermissions.includes(permission)) {
        throw Error(`Missing permission '${permission}' for syscall ${name}`);
      }
    }
    return Promise.resolve(syscall.callback(ctx, ...args));
  }
  localSyscall(contextPlugName, syscallName, args) {
    return this.syscallWithContext(
      { plug: { name: contextPlugName } },
      syscallName,
      args
    );
  }
  async load(manifest, sandboxFactory) {
    const name = manifest.name;
    if (this.plugs.has(name)) {
      await this.unload(name);
    }
    let errors = [];
    for (const feature of this.enabledHooks) {
      errors = [...errors, ...feature.validateManifest(manifest)];
    }
    if (errors.length > 0) {
      throw new Error(`Invalid manifest: ${errors.join(", ")}`);
    }
    const plug = new Plug(this, name, sandboxFactory);
    console.log("Loading", name);
    plug.load(manifest);
    this.plugs.set(name, plug);
    await this.emit("plugLoaded", plug);
    return plug;
  }
  async unload(name) {
    const plug = this.plugs.get(name);
    if (!plug) {
      throw Error(`Plug ${name} not found`);
    }
    await plug.stop();
    this.emit("plugUnloaded", name);
    this.plugs.delete(name);
  }
  toJSON() {
    const plugJSON = [];
    for (const [_, plug] of this.plugs) {
      if (!plug.manifest) {
        continue;
      }
      plugJSON.push(plug.manifest);
    }
    return plugJSON;
  }
  async replaceAllFromJSON(json, sandboxFactory) {
    await this.unloadAll();
    for (const manifest of json) {
      await this.load(manifest, sandboxFactory);
    }
  }
  unloadAll() {
    return Promise.all(
      Array.from(this.plugs.keys()).map(this.unload.bind(this))
    );
  }
}
