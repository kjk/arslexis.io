export class FileMetaSpacePrimitives {
  constructor(wrapped, indexSyscalls) {
    this.wrapped = wrapped;
    this.indexSyscalls = indexSyscalls;
  }
  async fetchFileList() {
    const files = await this.wrapped.fetchFileList();
    const allFilesMap = new Map(
      files.map((fm) => [fm.name, fm])
    );
    for (const { page, value } of await this.indexSyscalls["index.queryPrefix"](
      {},
      "meta:"
    )) {
      const p = allFilesMap.get(`${page}.md`);
      if (p) {
        for (const [k, v] of Object.entries(value)) {
          if (["name", "lastModified", "size", "perm", "contentType"].includes(k)) {
            continue;
          }
          p[k] = v;
        }
      }
    }
    return [...allFilesMap.values()];
  }
  readFile(name, encoding) {
    return this.wrapped.readFile(name, encoding);
  }
  getFileMeta(name) {
    return this.wrapped.getFileMeta(name);
  }
  writeFile(name, encoding, data, selfUpdate) {
    return this.wrapped.writeFile(name, encoding, data, selfUpdate);
  }
  deleteFile(name) {
    return this.wrapped.deleteFile(name);
  }
  proxySyscall(plug, name, args) {
    return this.wrapped.proxySyscall(plug, name, args);
  }
  invokeFunction(plug, env, name, args) {
    return this.wrapped.invokeFunction(plug, env, name, args);
  }
}
