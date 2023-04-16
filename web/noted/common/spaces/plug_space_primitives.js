import { base64DecodeDataUrl } from "../../plugos/asset_bundle/base64.js";
export class PlugSpacePrimitives {
  constructor(wrapped, hook, env) {
    this.wrapped = wrapped;
    this.hook = hook;
    this.env = env;
  }
  performOperation(type, pageName, ...args) {
    for (const { operation, pattern, plug, name, env } of this.hook
      .spaceFunctions) {
      if (
        operation === type &&
        pageName.match(pattern) &&
        (!this.env || (env && env === this.env))
      ) {
        return plug.invoke(name, [pageName, ...args]);
      }
    }
    return false;
  }
  async fetchFileList() {
    const allFiles = [];
    for (const { plug, name, operation } of this.hook.spaceFunctions) {
      if (operation === "listFiles") {
        try {
          for (const pm of await plug.invoke(name, [])) {
            allFiles.push(pm);
          }
        } catch (e) {
          console.error("Error listing files", e);
        }
      }
    }
    const files = await this.wrapped.fetchFileList();
    for (const pm of files) {
      allFiles.push(pm);
    }
    return allFiles;
  }
  async readFile(name, encoding) {
    const wantArrayBuffer = encoding === "arraybuffer";
    const result = await this.performOperation(
      "readFile",
      name,
      wantArrayBuffer ? "dataurl" : encoding
    );
    if (result) {
      if (wantArrayBuffer) {
        return {
          data: base64DecodeDataUrl(result.data),
          meta: result.meta,
        };
      } else {
        return result;
      }
    }
    return this.wrapped.readFile(name, encoding);
  }
  getFileMeta(name) {
    const result = this.performOperation("getFileMeta", name);
    if (result) {
      return result;
    }
    return this.wrapped.getFileMeta(name);
  }
  writeFile(name, encoding, data, selfUpdate) {
    const result = this.performOperation(
      "writeFile",
      name,
      encoding,
      data,
      selfUpdate
    );
    if (result) {
      return result;
    }
    return this.wrapped.writeFile(name, encoding, data, selfUpdate);
  }
  deleteFile(name) {
    const result = this.performOperation("deleteFile", name);
    if (result) {
      return result;
    }
    return this.wrapped.deleteFile(name);
  }
  proxySyscall(plug, name, args) {
    return this.wrapped.proxySyscall(plug, name, args);
  }
  invokeFunction(plug, env, name, args) {
    return this.wrapped.invokeFunction(plug, env, name, args);
  }
}
