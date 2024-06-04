// a directory tree. each element is either a file:
// [file,      dirHandle, name, path, size, null]
// or directory:
// [[entries], dirHandle, name, path, size, null]
// extra null value is for the caller to stick additional data
// without the need to re-allocate the array
// if you need more than 1, use an object

import { throwIf } from "./util";

// handle (file or dir), parentHandle (dir), size, path, dirEntries, meta
const handleIdx = 0;
const parentHandleIdx = 1;
const sizeIdx = 2;
const pathIdx = 3;
const dirEntriesIdx = 4;
const metaIdx = 5;

export class FsEntry extends Array {
  /**
   * @returns {string}
   */
  get name() {
    return this[handleIdx].name;
  }

  /**
   * @returns {boolean}
   */
  get isDir() {
    return this[handleIdx].kind === "directory";
  }

  /**
   * @returns {number}
   */
  get size() {
    return this[sizeIdx];
  }

  /**
   * @param {number} n
   */
  set size(n) {
    throwIf(!this.isDir);
    this[sizeIdx] = n;
  }

  /**
   * @returns {string}
   */
  get path() {
    return this[pathIdx];
  }

  /**
   * @param {string} v
   */
  set path(v) {
    this[pathIdx] = v;
  }

  /**
   * @return any
   */
  get meta() {
    return this[metaIdx];
  }

  set meta(o) {
    this[metaIdx] = o;
  }

  /**
   * @returns {Promise<File>}
   */
  async getFile() {
    throwIf(this.isDir);
    let h = this[handleIdx];
    return await h.getFile();
  }

  /**
   * @param {string} key
   * @retruns {any}
   */
  getMeta(key) {
    let m = this[metaIdx];
    return m ? m[key] : undefined;
  }

  /**
   * @param {string} key
   * @param {any} val
   */
  setMeta(key, val) {
    let m = this[metaIdx] || {};
    m[key] = val;
    this[metaIdx] = m;
  }

  get handle() {
    return this[handleIdx];
  }

  get parentDirHandle() {
    return this[parentHandleIdx];
  }

  /**
   * @returns {FsEntry[]}
   */
  get dirEntries() {
    throwIf(!this.isDir);
    return this[dirEntriesIdx];
  }

  /**
   * @param {FsEntry[]} v
   */
  set dirEntries(v) {
    throwIf(!this.isDir);
    this[dirEntriesIdx] = v;
  }

  /**
   * @param {any} handle
   * @param {any} parentHandle
   * @param {string} path
   * @returns {Promise<FsEntry>}
   */
  static async fromHandle(handle, parentHandle, path) {
    let size = 0;
    if (handle.kind === "file") {
      let file = await handle.getFile();
      size = file.size;
    }
    return new FsEntry(handle, parentHandle, size, path, [], null);
  }
}

function dontSkip(entry, dir) {
  return false;
}

/**
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {Function} skipEntryFn
 * @param {string} dir
 * @returns {Promise<FsEntry>}
 */
export async function readDir(
  dirHandle,
  skipEntryFn = dontSkip,
  dir = dirHandle.name
) {
  /** @type {FsEntry[]} */
  let entries = [];
  // @ts-ignore
  for await (const handle of dirHandle.values()) {
    if (skipEntryFn(handle, dir)) {
      continue;
    }
    const path = dir == "" ? handle.name : `${dir}/${handle.name}`;
    let e = await FsEntry.fromHandle(handle, dirHandle, path);
    entries.push(e);
  }
  let res = new FsEntry(dirHandle, null, dir);
  res.dirEntries = entries;
  return res;
}

/**
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {string} dir
 * @returns {Promise<File[]>}
 */
export async function readDirRecurFiles(dirHandle, dir = dirHandle.name) {
  const dirs = [];
  const files = [];
  for await (const entry of dirHandle.values()) {
    const path = dir == "" ? entry.name : `${dir}/${entry.name}`;
    if (entry.kind === "file") {
      let fh = /** @type {FileSystemFileHandle} */ (entry);
      files.push(
        fh.getFile().then((file) => {
          // @ts-ignore
          file.directoryHandle = dirHandle;
          // @ts-ignore
          file.handle = entry;
          return Object.defineProperty(file, "webkitRelativePath", {
            configurable: true,
            enumerable: true,
            get: () => path,
          });
        })
      );
    } else if (entry.kind === "directory") {
      let dh = /** @type {FileSystemDirectoryHandle} */ (entry);
      dirs.push(readDirRecurFiles(dh, path));
    }
  }
  return [...(await Promise.all(dirs)).flat(), ...(await Promise.all(files))];
}
