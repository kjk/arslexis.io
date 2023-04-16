export class EventedSpacePrimitives {
  constructor(wrapped, eventHook) {
    this.wrapped = wrapped;
    this.eventHook = eventHook;
  }
  fetchFileList() {
    return this.wrapped.fetchFileList();
  }
  proxySyscall(plug, name, args) {
    return this.wrapped.proxySyscall(plug, name, args);
  }
  invokeFunction(plug, env, name, args) {
    return this.wrapped.invokeFunction(plug, env, name, args);
  }
  readFile(name, encoding) {
    return this.wrapped.readFile(name, encoding);
  }
  async writeFile(name, encoding, data, selfUpdate) {
    const newMeta = await this.wrapped.writeFile(
      name,
      encoding,
      data,
      selfUpdate
    );
    if (name.endsWith(".md")) {
      const pageName = name.substring(0, name.length - 3);
      let text = "";
      switch (encoding) {
        case "utf8":
          text = data;
          break;
        case "arraybuffer":
          {
            const decoder = new TextDecoder("utf-8");
            text = decoder.decode(data);
          }
          break;
        case "dataurl":
          throw Error("Data urls not supported in this context");
      }
      this.eventHook.dispatchEvent("page:saved", pageName).then(() => {
        return this.eventHook.dispatchEvent("page:index_text", {
          name: pageName,
          text
        });
      }).catch((e) => {
        console.error("Error dispatching page:saved event", e);
      });
    }
    return newMeta;
  }
  getFileMeta(name) {
    return this.wrapped.getFileMeta(name);
  }
  async deleteFile(name) {
    if (name.endsWith(".md")) {
      const pageName = name.substring(0, name.length - 3);
      await this.eventHook.dispatchEvent("page:deleted", pageName);
    }
    return this.wrapped.deleteFile(name);
  }
}
