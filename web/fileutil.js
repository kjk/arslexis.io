import { throwIf } from "./util";

// not
const binaryExts = [
  ".bmp",
  ".ico",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
  ".jfif",
  ".tiff",
  ".xd",
  ".a",
  ".xz",
  ".gz",
  ".tar",
  ".zip",
  ".rar",
  ".7z",
  ".cbz",
  ".cbr",
  ".cb7",
  ".exe",
  ".dll",
  ".pdb",
  ".lib",
  ".ttf",
  ".otf",
  ".afm",
];

export function isBinary(path) {
  // if (path.includes(".git/")) {
  //   return true;
  // }
  let ext = getFileExt(path);
  return binaryExts.includes(ext);
}

/**
 * @param {Blob} blog
 * @returns {Promise<number>}
 */
export async function lineCount(blog) {
  if (blog.size === 0) {
    return 0;
  }
  let ab = await blog.arrayBuffer();
  let a = new Uint8Array(ab);
  let nLines = 0;
  // if last character is not newline, we must add +1 to line count
  let toAdd = 0;
  for (let b of a) {
    // line endings are:
    // CR (13) LF (10) : windows
    // LF (10) : unix
    // CR (13) : mac
    // mac is very rare so we just count 10 as they count
    // windows and unix lines
    if (b === 10) {
      toAdd = 0;
      nLines++;
    } else {
      toAdd = 1;
    }
  }
  return nLines + toAdd;
}

/**
 * "foo.TXT" => ".txt"
 * "foo" => ""
 * @param {string} fileName
 * @returns {string}
 */
export function getFileExt(fileName) {
  let parts = fileName.split(".");
  let n = parts.length;
  if (n > 1) {
    return "." + parts[n - 1].toLowerCase();
  }
  return "";
}
/**
 * foo.txt => foo-1.txt, foo-1.txt => foo-2.txt etc.
 * @param {string} s
 * @returns {string}
 */
export function genNextUniqueFileName(s) {
  /**
   * @param {string} s
   * @returns {number|null}
   */
  function toNumberOrNull(s) {
    const n = parseInt(s);
    const ns = `${n}`;
    if (s === ns) {
      return n;
    }
    return null;
  }

  let ext = "";
  let parts = s.split(".");
  let n = parts.length;
  if (n > 1) {
    ext = "." + parts[n - 1];
    s = parts.slice(0, n - 1).join(".");
  }
  parts = s.split("-");
  n = parts.length;
  if (n === 1) {
    return parts[0] + "-1" + ext;
  }
  const currSuffix = toNumberOrNull(parts[n - 1]);
  if (currSuffix === null) {
    return s + "-1" + ext;
  }
  const newSuffix = `${currSuffix + 1}`;
  parts[n - 1] = newSuffix;
  s = parts.join("-");
  return s + ext;
}

/**
 *
 * @param {any} fileHandle
 * @param {boolean} readWrite
 * @returns {Promise<boolean>}
 */
export async function verifyHandlePermission(fileHandle, readWrite) {
  const options = {};
  if (readWrite) {
    options.mode = "readwrite";
  }
  // Check if permission was already granted. If so, return true.
  if ((await fileHandle.queryPermission(options)) === "granted") {
    return true;
  }
  // Request permission. If the user grants permission, return true.
  if ((await fileHandle.requestPermission(options)) === "granted") {
    return true;
  }
  // The user didn't grant permission, so return false.
  return false;
}

/**
 * @returns {boolean}
 */
export function isIFrame() {
  let isIFrame = false;
  try {
    // in iframe, those are different
    isIFrame = window.self !== window.top;
  } catch {
    // do nothing
  }
  return isIFrame;
}

/**
 * @returns {boolean}
 */
export function supportsFileSystem() {
  const ok = "showDirectoryPicker" in window && !isIFrame();
  return ok;
}

// a directory tree. each element is either a file:
// [file,      dirHandle, name, path, size, null]
// or directory:
// [[entries], dirHandle, name, path, size, null]
// extra null value is for the caller to stick additional data
// without the need to re-allocate the array
// if you need more than 1, use an object

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
export async function readDirRecur(
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
    if (handle.kind === "file") {
      let e = await FsEntry.fromHandle(handle, dirHandle, path);
      entries.push(e);
    } else if (handle.kind === "directory") {
      let e = await readDirRecur(handle, skipEntryFn, path);
      e.path = path;
      entries.push(e);
    }
  }
  let res = new FsEntry(dirHandle, null, dir);
  res.dirEntries = entries;
  return res;
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
  // @ts-ignore
  for await (const entry of dirHandle.values()) {
    const path = dir == "" ? entry.name : `${dir}/${entry.name}`;
    if (entry.kind === "file") {
      files.push(
        entry.getFile().then((file) => {
          file.directoryHandle = dirHandle;
          file.handle = entry;
          return Object.defineProperty(file, "webkitRelativePath", {
            configurable: true,
            enumerable: true,
            get: () => path,
          });
        })
      );
    } else if (entry.kind === "directory") {
      dirs.push(readDirRecurFiles(entry, path));
    }
  }
  return [...(await Promise.all(dirs)).flat(), ...(await Promise.all(files))];
}

/**
 *
 * @param {FsEntry} dir
 * @param {Function} fn
 */
export function forEachFsEntry(dir, fn) {
  let entries = dir.dirEntries;
  for (let e of entries) {
    let skip = fn(e);
    if (!skip && e.isDir) {
      forEachFsEntry(e, fn);
    }
  }
  fn(dir);
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker
 * @returns {Promise<FileSystemDirectoryHandle>}
 */
export async function openDirPicker() {
  const opts = {
    mutltiple: false,
  };
  try {
    // @ts-ignore
    const fh = await window.showDirectoryPicker(opts);
    return fh;
  } catch (e) {
    console.log("openDirPicker: showDirectoryPicker: e:", e);
  }
  return null;
}
