import { AssetBundle } from "./asset_bundle/bundle.js";
export class Plug {
  constructor(system, name, sandboxFactory) {
    this.grantedPermissions = [];
    this.sandboxInitialized = void 0;
    this.system = system;
    this.name = name;
    this.sandboxFactory = sandboxFactory;
    this.runtimeEnv = system.env;
    this.version = new Date().getTime();
  }
  lazyInitSandbox() {
    if (this.sandboxInitialized) {
      return this.sandboxInitialized;
    }
    this.sandboxInitialized = Promise.resolve().then(async () => {
      console.log("Now starting sandbox for", this.name);
      this.sandbox = this.sandboxFactory(this);
      for (const [dep, code] of Object.entries(
        this.manifest.dependencies || {}
      )) {
        await this.sandbox.loadDependency(dep, code);
      }
      await this.system.emit("sandboxInitialized", this.sandbox, this);
    });
    return this.sandboxInitialized;
  }
  load(manifest) {
    this.manifest = manifest;
    this.assets = new AssetBundle(manifest.assets ? manifest.assets : {});
    this.grantedPermissions = manifest.requiredPermissions || [];
  }
  syscall(name, args) {
    return this.system.syscallWithContext({ plug: this }, name, args);
  }
  canInvoke(name) {
    if (!this.manifest) {
      return false;
    }
    const funDef = this.manifest.functions[name];
    if (!funDef) {
      throw new Error(`Function ${name} not found in manifest`);
    }
    return !funDef.env || !this.runtimeEnv || funDef.env === this.runtimeEnv;
  }
  async invoke(name, args) {
    const funDef = this.manifest.functions[name];
    if (!funDef) {
      throw new Error(`Function ${name} not found in manifest`);
    }
    await this.lazyInitSandbox();
    const sandbox = this.sandbox;
    if (funDef.redirect) {
      let plug = this;
      if (funDef.redirect.indexOf(".") !== -1) {
        const [plugName, functionName] = funDef.redirect.split(".");
        plug = this.system.loadedPlugs.get(plugName);
        if (!plug) {
          throw Error(`Plug ${plugName} redirected to not found`);
        }
        name = functionName;
      } else {
        name = funDef.redirect;
      }
      return plug.invoke(name, args);
    }
    if (!sandbox.isLoaded(name)) {
      if (!this.canInvoke(name)) {
        throw new Error(
          `Function ${name} is not available in ${this.runtimeEnv}`
        );
      }
      await sandbox.load(name, funDef.code);
    }
    return await sandbox.invoke(name, args);
  }
  stop() {
    if (this.sandbox) {
      this.sandbox.stop();
    }
  }
}
