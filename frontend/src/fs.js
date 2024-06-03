/*
Abstraction for file system with an eye for close to optimal performance
and being able to represent various kinds of filesystem (disk, s3 etc.).

FileSystem entries are represented by an opaque handle (a number).
*/

import { len } from "./util";

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
 * @property { (FsEntry) => number } entryMetaCount
 * @property { (FsEntry, string) => any } entryMetaValueByKey
 * @property { (FsEntry, number) => string } entryMetaKey
 * @property { (FsEntry, number) => any } entryMetaValue
 */

// index withing multiNumInfo flat array
const kParentIdx = 0;
const kSizeIdx = 1;
const kModTimeIdx = 2;
const kMeta1Idx = 3; // arbitrary metadata 1 value as number
const kMeta2Idx = 4; // arbitrary metadata 2 value as number
const kMultiNumPropsCount = 5;

/**
 * @param {FileSys} fs
 * @param {FsEntry} e
 * @returns {FsEntry[]}
 */
export function entryPath(fs, e) {
  let res = [e];
  while (true) {
    e = fs.entryParent(e);
    if (e == kFileSysInvalidEntry) {
      res.reverse();
      return res;
    }
    res.push(e);
  }
}

/** @typedef {FileSystemHandle|FileSystemDirectoryHandle} FileSysHandle */

/**
 * Efficient implementation of storing info about direcotry
 * @implements {FileSys}
 */
export class FileSysDir {
  /** @type {string[]} */
  names = [];
  /** @type {FileSystemHandle[]} */
  handles = [];
  /** @type {number[]} */
  multiNumInfo = [];

  // TODO: optimize as a flat array and keeping info
  // as index / length into the array
  // if value is null, it's directory
  //
  /** @type {FsEntry[][]} */
  children = [];

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
    return children === null;
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
    return;
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
   * @param {FsEntry} e
   * @param {number} metaIdx
   * @param {number} val
   */
  setFixedMeta(e, metaIdx, val) {
    let idx = e * kMultiNumPropsCount + kMeta1Idx + metaIdx;
    this.multiNumInfo[idx] = val;
  }

  /**
   * @param {FsEntry} e
   * @param {number} metaIdx
   * @returns {number}
   */
  getFixedMeta(e, metaIdx) {
    let idx = e * kMultiNumPropsCount + kMeta1Idx + metaIdx;
    return this.multiNumInfo[idx];
  }

  /**
   * @param {FsEntry} e
   * @returns {number}
   */
  entryMetaCount(e) {
    return 0;
  }

  /**
   * @param {FsEntry} e
   * @param {string} key
   * @returns {any}
   */
  entryMetaValueByKey(e, key) {
    return undefined;
  }

  /**
   * @param {FsEntry} e
   * @param {number} i
   * @returns {string}
   */
  entryMetaKey(e, i) {
    return null;
  }

  /**
   * @param {FsEntry} e
   * @param {number} i
   * @returns {any}
   */
  entryMetaValue(e, i) {
    return undefined;
  }

  /**
   * @param {FsEntry} parent
   * @param {string} name
   * @param {FileSysHandle} handle
   * @returns {FsEntry}
   */
  allocEntry(parent, name, handle = null) {
    let e = len(this.names);
    this.names.push(name);
    this.handles.push(handle);
    this.children.push(null);
    this.multiNumInfo.push(parent, -1, -1, -1);
    return e;
  }
}

/**
 * @callback readFileSysDirCallback
 * @param {FileSysDir} fs
 * @param {number} nFiles
 * @param {number} nDirs
 * @param {boolean} finished
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
  while (len(dirsToVisit) > 0) {
    progress(fs, nFiles, nDirs, false);
    let parent = dirsToVisit.shift();
    let children = [];
    fs.children[parent] = children;
    // for await (const [name, handle] of dirHandle)
    for await (const fshandle of dirHandle.values()) {
      name = fshandle.name;
      let echild = fs.allocEntry(parent, name, fshandle);
      children.push(echild);
      if (fshandle.kind === "directory") {
        dirsToVisit.push(echild);
        nDirs++;
        continue;
      }
      if (fshandle.kind === "file") {
        // @ts-ignore
        let f = /** @type { File } */ (await fshandle.getFile());
        let info = fs.multiNumInfo;
        let idx = echild * kMultiNumPropsCount;
        info[idx + kSizeIdx] = f.size;
        info[idx + kModTimeIdx] = f.lastModified;
        nFiles++;
        continue;
      }
      // should not be anything else
    }
  }
  progress(fs, nFiles, nDirs, true);
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
