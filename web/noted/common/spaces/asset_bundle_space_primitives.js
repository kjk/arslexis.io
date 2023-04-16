const bootTime = Date.now();
export class AssetBundlePlugSpacePrimitives {
  constructor(wrapped, assetBundle) {
    this.wrapped = wrapped;
    this.assetBundle = assetBundle;
  }
  async fetchFileList() {
    const files = await this.wrapped.fetchFileList();
    return this.assetBundle.listFiles().filter((p) => p.startsWith("_plug/")).map((p) => ({
      name: p,
      contentType: "application/json",
      lastModified: bootTime,
      perm: "ro",
      size: -1
    })).concat(files);
  }
  readFile(name, encoding) {
    if (this.assetBundle.has(name)) {
      const data = this.assetBundle.readFileSync(name);
      return Promise.resolve({
        data: encoding === "utf8" ? new TextDecoder().decode(data) : data,
        meta: {
          lastModified: bootTime,
          size: data.byteLength,
          perm: "ro",
          contentType: "application/json"
        }
      });
    }
    return this.wrapped.readFile(name, encoding);
  }
  getFileMeta(name) {
    if (this.assetBundle.has(name)) {
      const data = this.assetBundle.readFileSync(name);
      return Promise.resolve({
        lastModified: bootTime,
        size: data.byteLength,
        perm: "ro",
        contentType: "application/json"
      });
    }
    return this.wrapped.getFileMeta(name);
  }
  writeFile(name, encoding, data, selfUpdate) {
    return this.wrapped.writeFile(name, encoding, data, selfUpdate);
  }
  deleteFile(name) {
    if (this.assetBundle.has(name)) {
      return Promise.resolve();
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
