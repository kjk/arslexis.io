/*
Abstraction for file system with an eye for close to optimal performance
and being able to represent various kinds of filesystem (disk, s3 etc.).

FileSystem entries are represented by an opaque handle (a number).
*/

import { len, throwIf } from "./util";

export const kFileSysInvalidEntry = -1;

/** @typedef {number} FsEntry */

// Note: FileSystem is a type in js stdlib
/**
 * @typedef {Object} FileSys
 * @property { () => FsEntry } rootEntry
 * @property { (FsEntry) => FsEntry } entryParent
 * @property { (FsEntry) => boolean } entryIsDir
 * @property { (FsEntry) => string } entryName
 * @property { (FsEntry) => number } entrySize
 * @property { (FsEntry) => number } entryCreateTime
 * @property { (FsEntry) => number } entryModTime
 * @property { (FsEntry) => number[] } entryChildren
 * @property { (FsEntry) => number[] } entryDirs
 * @property { (FsEntry) => number[] } entryFiles
 * @property { (FsEntry) => number } entryDirCount
 * @property { (FsEntry) => number } entryFileCount
 * @property { (FsEntry) => any[] } entryMetaAll // returns all metadata
 * @property { (FsEntry, string, any) => any } entrySetMeta
 * @property { (FsEntry, string) => any } entryMeta
 */

// index withing multiNumInfo flat array
const kParentIdx = 0;
const kSizeIdx = 1;
const kModTimeIdx = 2;
const kFirstMetaIdx = 3;
const kMultiNumPropsCount = 4;

/**
 * Efficient implementation of storing info about direcotry
 * @implements {FileSys}
 */
export class FileSysDir {
  /** @type {string[]} */
  names = [];
  /** @type {FileSystemDirectoryHandle[]} */
  handles = [];
  /** @type {number[]} */
  multiNumInfo = [];

  // this array interns keys used for meta values
  // it should be very short, because there shouldn't be
  // many unique meta values
  /** @type {string[]} */
  metaKeys = [];

  // multiNumInfo[kMultiNumPropsCount] is an idx into metaIndex
  // first element is interned key returned by internMetaKey(key)
  // second element is index into metaValues
  // third is idx into metaIndex and implements linked list of meta values
  //       if -1, this is the last value
  /** @type {number[]} */
  metaIndex = [];

  /** @type {any[]} */
  metaValues = [];

  // TODO: optimize as a flat array and keeping info
  // as index / length into the array
  // if value is null, it's directory
  //
  /** @type {FsEntry[][]} */
  children = [];

  /**
   * @param {string} key
   * @returns {number}
   */
  _internMetaKey(key) {
    let a = this.metaKeys;
    let n = len(a);
    for (let i = 0; i < n; i++) {
      if (a[i] === key) {
        return i;
      }
    }
    this.metaKeys.push(key);
    return n; // index of the newly appended key
  }

  /**
   * @param {FsEntry} e
   * @returns {any[]}
   */
  entryMetaAll(e) {
    return null;
  }

  /**
   * @param {FsEntry} e
   * @param {string} key
   * @param {any} val
   */
  entrySetMeta(e, key, val) {
    let valIdx = len(this.metaValues);
    this.metaValues.push(val);
    let keyIdx = this._internMetaKey(key);
    let mi = this.metaIndex;
    let metaIdx = len(mi);
    mi.push(keyIdx, valIdx, -1);

    let currIdx = this.multiNumInfo[e * kMultiNumPropsCount + kFirstMetaIdx];
    if (currIdx === -1) {
      this.multiNumInfo[e * kMultiNumPropsCount + kFirstMetaIdx] = metaIdx;
      return;
    }
    while (true) {
      let idx = currIdx * 3;
      let nextIdx = mi[idx + 2];
      if (nextIdx !== -1) {
        mi[idx + 2] = idx;
        return;
      }
      currIdx = nextIdx;
    }
  }

  /**
   * @param {FsEntry} e
   * @param {string} key
   * @returns {any}
   */
  entryMeta(e, key) {
    let currIdx = this.multiNumInfo[e * kMultiNumPropsCount + kFirstMetaIdx];
    let keyIdx = this._internMetaKey(key);
    let mi = this.metaIndex;
    while (currIdx !== -1) {
      let idx = currIdx * 3;
      let keyIdx2 = mi[idx];
      if (keyIdx2 === keyIdx) {
        let valIdx = mi[idx + 1];
        return this.metaValues[valIdx];
      }
      currIdx = mi[idx + 2];
    }
    return undefined;
  }

  /**
   * @returns {FsEntry}
   */
  rootEntry() {
    if (len(this.names) === 0) {
      return kFileSysInvalidEntry;
    }
    return 0;
  }

  /**
   * @param {FsEntry} e
   * @returns {FsEntry}
   */
  entryParent(e) {
    if (e == 0) {
      return kFileSysInvalidEntry;
    }
    let idx = kMultiNumPropsCount * 4 + kParentIdx;
    return this.multiNumInfo[idx];
  }

  /**
   * @param {FsEntry} e
   * @returns {string}
   */
  entryName(e) {
    return this.names[e];
  }

  /**
   * @param {FsEntry} e
   * @returns {number}
   */
  entrySize(e) {
    let idx = kMultiNumPropsCount * e + kSizeIdx;
    return this.multiNumInfo[idx];
  }

  /**
   * @param {FsEntry} e
   * @param {number} size
   */
  setEntrySize(e, size) {
    let idx = kMultiNumPropsCount * e + kSizeIdx;
    this.multiNumInfo[idx] = size;
  }

  /**
   * @param {FsEntry} e
   * @returns {boolean}
   */
  entryIsDir(e) {
    let children = this.children[e];
    return children !== null;
  }

  /**
   * @param {FsEntry} e
   * @returns {number}
   */
  entryCreateTime(e) {
    // browser API doesn't provide creation time so we re-use mod time
    let idx = kMultiNumPropsCount * e + kModTimeIdx;
    return this.multiNumInfo[idx];
  }

  /**
   * @param {FsEntry} e
   * @returns {number}
   */
  entryModTime(e) {
    let idx = kMultiNumPropsCount * e + kModTimeIdx;
    return this.multiNumInfo[idx];
  }

  /**
   * @param {FsEntry} e
   * @returns {number[]}
   */
  entryChildren(e) {
    return this.children[e];
  }

  /**
   * @param {FsEntry} e
   * @returns {Promise<FileSystemFileHandle>}
   */
  async entryFileHandle(e) {
    let isDir = this.entryIsDir(e);
    throwIf(isDir);
    let name = this.entryName(e);
    let parent = this.entryParent(e);
    let dh = this.handles[parent];
    dh.getFileHandle(name);
    return await dh.getFileHandle(name);
  }

  /**
   * @param {FsEntry} e
   * @returns {FileSystemDirectoryHandle}
   */
  entryDirHandle(e) {
    let isDir = this.entryIsDir(e);
    throwIf(isDir);
    return this.handles[e];
  }

  /**
   * @param {FsEntry} e
   * @param {boolean} forDirs
   * @returns {number}
   */
  _entryCountChildren(e, forDirs) {
    let c = this.children[e];
    let n = 0;
    for (let ec of c) {
      let isDir = this.entryIsDir(ec);
      if (isDir == forDirs) {
        n++;
      }
    }
    return n;
  }

  /**
   * @param {FsEntry} e
   * @returns {number}
   */
  entryDirCount(e) {
    return this._entryCountChildren(e, true);
  }

  /**
   * @param {FsEntry} e
   * @returns {number}
   */
  entryFileCount(e) {
    return this._entryCountChildren(e, false);
  }

  /**
   * @param {FsEntry} e
   * @param {boolean} forDirs
   * @returns {FsEntry[]}
   */
  _entryChildrenSubset(e, forDirs) {
    let n = this._entryCountChildren(e, forDirs);
    if (n === 0) {
      return [];
    }
    // perf: pre-allocate the array
    // TODO(perf): alternatively, ensure that dirs are always first
    // so we can just find the index of first file entry and
    // return subarrays
    /** @type {FsEntry[]} */
    let res = Array(n);
    let i = 0;
    let c = this.children[e];
    for (let ec of c) {
      let isDir = this.entryIsDir(ec);
      if (isDir === forDirs) {
        res[i++] = ec;
      }
    }
    return res;
  }

  /**
   * @param {FsEntry} e
   * @returns {FsEntry[]}
   */
  entryDirs(e) {
    return this._entryChildrenSubset(e, true);
  }

  /**
   * @param {FsEntry} e
   * @returns {FsEntry[]}
   */
  entryFiles(e) {
    return this._entryChildrenSubset(e, false);
  }

  /**
   * @param {FsEntry} parent
   * @param {string} name
   * @param {FileSystemDirectoryHandle} handle
   * @returns {FsEntry}
   */
  allocEntry(parent, name, handle) {
    let e = len(this.names);
    this.names.push(name);
    this.handles.push(handle);
    this.children.push(null);
    let oldSize = len(this.multiNumInfo);
    this.multiNumInfo.push(parent, -1, -1, -1);
    let newSize = len(this.multiNumInfo);
    throwIf(newSize != oldSize + kMultiNumPropsCount);
    return e;
  }
}

/**
 * @typedef {Object} ReadFilesCbArgs
 * @property {FileSysDir} fs
 * @property {string} dirName
 * @property {number} fileCount
 * @property {number} dirCount
 * @property {number} totalSize
 * @property {boolean} finished
 */

/**
 * @callback readFileSysDirCallback
 * @param {ReadFilesCbArgs} args
 * @returns {boolean}
 */

/**
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {readFileSysDirCallback} progress
 * @returns {Promise<FileSysDir>}
 */
export async function readFileSysDirRecur(dirHandle, progress) {
  let fs = new FileSysDir();
  let name = dirHandle.name;
  let entry = fs.allocEntry(kFileSysInvalidEntry, name, dirHandle);
  /** @type {FsEntry[]} */
  let dirsToVisit = [entry];
  let nDirs = 0;
  let nFiles = 0;
  let totalSize = 0;
  while (len(dirsToVisit) > 0) {
    let parent = dirsToVisit.shift();
    dirHandle = fs.handles[parent];
    if (nDirs % 10 == 0) {
      /** @type {ReadFilesCbArgs} */
      let arg = {
        fs,
        dirName: dirHandle.name,
        fileCount: nFiles,
        dirCount: nDirs,
        totalSize,
        finished: false,
      };
      let cont = progress(arg);
      if (!cont) {
        return fs;
      }
    }
    let children = [];
    // for await (const [name, handle] of dirHandle)
    for await (const fshandle of dirHandle.values()) {
      name = fshandle.name;
      let isDir = fshandle.kind === "directory";
      let isFile = fshandle.kind === "file";
      // perf: only store handle for directories
      // we need it to access files
      let h = null;
      if (isDir) {
        h = /** @type { FileSystemDirectoryHandle } */ (fshandle);
      }
      let echild = fs.allocEntry(parent, name, h);
      children.push(echild);
      if (isDir) {
        dirsToVisit.push(echild);
        nDirs++;
        continue;
      }
      if (isFile) {
        // @ts-ignore
        let f = /** @type { File } */ (await fshandle.getFile());
        let info = fs.multiNumInfo;
        let idx = echild * kMultiNumPropsCount;
        info[idx + kSizeIdx] = f.size;
        info[idx + kModTimeIdx] = f.lastModified;
        nFiles++;
        totalSize += f.size;
        continue;
      }
      // should not be anything else
    }
    fs.children[parent] = children;
  }
  // progress(fs, "", nFiles, nDirs, true);
  return fs;
}

/**
 * @param {FileSysDir} fs
 * @param {FsEntry} e
 * @returns {number}
 */
function calcDirSizeRecur(fs, e) {
  let c = fs.entryChildren(e);
  let size = 0;
  for (let ec of c) {
    if (!fs.entryIsDir(ec)) {
      size += fs.entrySize(ec);
      continue;
    }
    if (fs.entryIsDir(ec)) {
      let childSize = calcDirSizeRecur(fs, ec);
      size += childSize;
    }
  }
  fs.setEntrySize(e, size);
  return size;
}

/**
 * @param {FileSysDir} fs
 */
export function calcDirSizes(fs) {
  let root = fs.rootEntry();
  calcDirSizeRecur(fs, root);
}

/**
 * @param {FileSys} fs
 * @param {FsEntry} e
 * @returns {FsEntry[]}
 */
export function entryPath(fs, e) {
  let res = [];
  while (e !== kFileSysInvalidEntry) {
    res.push(e);
    e = fs.entryParent(e);
  }
  res.reverse();
  return res;
}

/**
 * @param {FileSys} fs
 * @param {FsEntry} e
 * @returns {string}
 */
export function entryFullPath(fs, e) {
  let parts = [];
  while (e !== kFileSysInvalidEntry) {
    let name = fs.entryName(e);
    parts.push(name);
    e = fs.entryParent(e);
  }
  parts.reverse();
  return parts.join("/");
}
