import { EventEmitter } from "../../plugos/event.js";
import { plugPrefix } from "./constants.js";
import { safeRun } from "../util.js";
const pageWatchInterval = 2e3;
export class Space extends EventEmitter {
  constructor(spacePrimitives) {
    super();
    this.spacePrimitives = spacePrimitives;
    this.pageMetaCache = /* @__PURE__ */ new Map();
    this.watchedPages = /* @__PURE__ */ new Set();
    this.initialPageListLoad = true;
    this.saving = false;
  }
  async readFile(path, encoding) {
    return (await this.spacePrimitives.readFile(path, encoding)).data;
  }
  getFileMeta(path) {
    return this.spacePrimitives.getFileMeta(path);
  }
  writeFile(path, text, encoding) {
    return this.spacePrimitives.writeFile(path, encoding, text);
  }
  deleteFile(path) {
    return this.spacePrimitives.deleteFile(path);
  }
  async listFiles(path) {
    return (await this.spacePrimitives.fetchFileList()).filter((f) =>
      f.name.startsWith(path)
    );
  }
  async updatePageList() {
    const newPageList = await this.fetchPageList();
    const deletedPages = new Set(this.pageMetaCache.keys());
    newPageList.forEach((meta) => {
      const pageName = meta.name;
      const oldPageMeta = this.pageMetaCache.get(pageName);
      const newPageMeta = { ...meta };
      if (
        !oldPageMeta &&
        (pageName.startsWith(plugPrefix) || !this.initialPageListLoad)
      ) {
        this.emit("pageCreated", newPageMeta);
      } else if (
        oldPageMeta &&
        oldPageMeta.lastModified !== newPageMeta.lastModified
      ) {
        this.emit("pageChanged", newPageMeta);
      }
      deletedPages.delete(pageName);
      this.pageMetaCache.set(pageName, newPageMeta);
    });
    for (const deletedPage of deletedPages) {
      this.pageMetaCache.delete(deletedPage);
      this.emit("pageDeleted", deletedPage);
    }
    this.emit("pageListUpdated", this.listPages());
    this.initialPageListLoad = false;
  }
  watch() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
    }
    this.watchInterval = setInterval(() => {
      safeRun(async () => {
        if (this.saving) {
          return;
        }
        for (const pageName of this.watchedPages) {
          const oldMeta = this.pageMetaCache.get(pageName);
          if (!oldMeta) {
            this.watchedPages.delete(pageName);
            continue;
          }
          await this.getPageMeta(pageName);
        }
      });
    }, pageWatchInterval);
    this.updatePageList().catch(console.error);
  }
  unwatch() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
    }
  }
  async deletePage(name) {
    await this.getPageMeta(name);
    await this.spacePrimitives.deleteFile(`${name}.md`);
    this.pageMetaCache.delete(name);
    this.emit("pageDeleted", name);
    this.emit(
      "pageListUpdated",
      /* @__PURE__ */ new Set([...this.pageMetaCache.values()])
    );
  }
  async getPageMeta(name) {
    const oldMeta = this.pageMetaCache.get(name);
    const newMeta = fileMetaToPageMeta(
      await this.spacePrimitives.getFileMeta(`${name}.md`)
    );
    if (oldMeta) {
      if (oldMeta.lastModified !== newMeta.lastModified) {
        this.emit("pageChanged", newMeta);
      }
    }
    return this.metaCacher(name, newMeta);
  }
  invokeFunction(plug, env, name, args) {
    return this.spacePrimitives.invokeFunction(plug, env, name, args);
  }
  listPages() {
    return [...new Set(this.pageMetaCache.values())];
  }
  async listPlugs() {
    const files = await this.spacePrimitives.fetchFileList();
    return files
      .filter((fileMeta) => fileMeta.name.endsWith(".plug.json"))
      .map((fileMeta) => fileMeta.name);
  }
  proxySyscall(plug, name, args) {
    return this.spacePrimitives.proxySyscall(plug, name, args);
  }
  async readPage(name) {
    const pageData = await this.spacePrimitives.readFile(`${name}.md`, "utf8");
    const previousMeta = this.pageMetaCache.get(name);
    const newMeta = fileMetaToPageMeta(pageData.meta);
    if (previousMeta) {
      if (previousMeta.lastModified !== newMeta.lastModified) {
        this.emit("pageChanged", newMeta);
      }
    }
    const meta = this.metaCacher(name, newMeta);
    return {
      text: pageData.data,
      meta,
    };
  }
  watchPage(pageName) {
    this.watchedPages.add(pageName);
  }
  unwatchPage(pageName) {
    this.watchedPages.delete(pageName);
  }
  async writePage(name, text, selfUpdate) {
    try {
      this.saving = true;
      const pageMeta = fileMetaToPageMeta(
        await this.spacePrimitives.writeFile(
          `${name}.md`,
          "utf8",
          text,
          selfUpdate
        )
      );
      if (!selfUpdate) {
        this.emit("pageChanged", pageMeta);
      }
      return this.metaCacher(name, pageMeta);
    } finally {
      this.saving = false;
    }
  }
  async fetchPageList() {
    return (await this.spacePrimitives.fetchFileList())
      .filter((fileMeta) => fileMeta.name.endsWith(".md"))
      .map(fileMetaToPageMeta);
  }
  async fetchAttachmentList() {
    return (await this.spacePrimitives.fetchFileList()).filter(
      (fileMeta) =>
        !fileMeta.name.endsWith(".md") &&
        !fileMeta.name.endsWith(".plug.json") &&
        fileMeta.name !== "data.db"
    );
  }
  readAttachment(name, encoding) {
    return this.spacePrimitives.readFile(name, encoding);
  }
  getAttachmentMeta(name) {
    return this.spacePrimitives.getFileMeta(name);
  }
  writeAttachment(name, encoding, data, selfUpdate) {
    return this.spacePrimitives.writeFile(name, encoding, data, selfUpdate);
  }
  deleteAttachment(name) {
    return this.spacePrimitives.deleteFile(name);
  }
  metaCacher(name, meta) {
    if (meta.lastModified !== 0) {
      this.pageMetaCache.set(name, meta);
    }
    return meta;
  }
}
function fileMetaToPageMeta(fileMeta) {
  return {
    ...fileMeta,
    name: fileMeta.name.substring(0, fileMeta.name.length - 3),
  };
}
