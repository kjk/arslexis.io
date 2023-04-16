import {
  base64DecodeDataUrl,
  base64EncodedDataUrl,
} from "../../plugos/asset_bundle/base64.js";

import { mime } from "https://deno.land/x/mimetypes@v1.0.0/mod.js";
import { path } from "../deps.js";
import { readAll } from "../deps.js";
import { walk } from "../../plugos/deps.js";

function lookupContentType(path2) {
  return mime.getType(path2) || "application/octet-stream";
}
function normalizeForwardSlashPath(path2) {
  return path2.replaceAll("\\", "/");
}
const excludedFiles = ["data.db", "data.db-journal", "sync.json"];
export class DiskSpacePrimitives {
  constructor(rootPath) {
    this.rootPath = Deno.realPathSync(rootPath);
  }
  safePath(p) {
    const realPath = path.resolve(p);
    if (!realPath.startsWith(this.rootPath)) {
      throw Error(`Path ${p} is not in the space`);
    }
    return realPath;
  }
  filenameToPath(pageName) {
    return this.safePath(path.join(this.rootPath, pageName));
  }
  pathToFilename(fullPath) {
    return fullPath.substring(this.rootPath.length + 1);
  }
  async readFile(name, encoding) {
    const localPath = this.filenameToPath(name);
    try {
      const s = await Deno.stat(localPath);
      let data = null;
      const contentType = lookupContentType(name);
      switch (encoding) {
        case "utf8":
          data = await Deno.readTextFile(localPath);
          break;
        case "dataurl":
          {
            const f = await Deno.open(localPath, { read: true });
            const buf = await readAll(f);
            Deno.close(f.rid);
            data = base64EncodedDataUrl(contentType, buf);
          }
          break;
        case "arraybuffer":
          {
            const f = await Deno.open(localPath, { read: true });
            const buf = await readAll(f);
            Deno.close(f.rid);
            data = buf.buffer;
          }
          break;
      }
      return {
        data,
        meta: {
          name,
          lastModified: s.mtime.getTime(),
          perm: "rw",
          size: s.size,
          contentType,
        },
      };
    } catch {
      throw Error(`Could not read file ${name}`);
    }
  }
  async writeFile(name, encoding, data) {
    const localPath = this.filenameToPath(name);
    try {
      await Deno.mkdir(path.dirname(localPath), { recursive: true });
      switch (encoding) {
        case "utf8":
          await Deno.writeTextFile(`${localPath}`, data);
          break;
        case "dataurl":
          await Deno.writeFile(localPath, base64DecodeDataUrl(data));
          break;
        case "arraybuffer":
          await Deno.writeFile(localPath, new Uint8Array(data));
          break;
      }
      const s = await Deno.stat(localPath);
      return {
        name,
        size: s.size,
        contentType: lookupContentType(name),
        lastModified: s.mtime.getTime(),
        perm: "rw",
      };
    } catch (e) {
      console.error("Error while writing file", name, e);
      throw Error(`Could not write ${name}`);
    }
  }
  async getFileMeta(name) {
    const localPath = this.filenameToPath(name);
    try {
      const s = await Deno.stat(localPath);
      return {
        name,
        size: s.size,
        contentType: lookupContentType(name),
        lastModified: s.mtime.getTime(),
        perm: "rw",
      };
    } catch {
      throw Error(`Could not get meta for ${name}`);
    }
  }
  async deleteFile(name) {
    const localPath = this.filenameToPath(name);
    await Deno.remove(localPath);
  }
  async fetchFileList() {
    const allFiles = [];
    for await (const file of walk(this.rootPath, {
      includeDirs: false,
      skip: [new RegExp(`^${escapeRegExp(this.rootPath)}.*\\/\\..+$`)],
    })) {
      const fullPath = file.path;
      try {
        const s = await Deno.stat(fullPath);
        const name = fullPath.substring(this.rootPath.length + 1);
        if (excludedFiles.includes(name)) {
          continue;
        }
        allFiles.push({
          name: normalizeForwardSlashPath(name),
          lastModified: s.mtime.getTime(),
          contentType: mime.getType(fullPath) || "application/octet-stream",
          size: s.size,
          perm: "rw",
        });
      } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
        } else {
          console.error("Failed to stat", fullPath, e);
        }
      }
    }
    return allFiles;
  }
  invokeFunction(plug, _env, name, args) {
    return plug.invoke(name, args);
  }
  proxySyscall(plug, name, args) {
    return plug.syscall(name, args);
  }
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
