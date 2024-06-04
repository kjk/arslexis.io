/*
Abstraction for file system with an eye for close to optimal performance
and being able to represent various kinds of filesystem (disk, s3 etc.).

FileSystem entries are represented by an opaque handle (a number).
*/

import { internStringArray, len, throwIf } from "./util";

import { strCompareNoCase } from "./strutil";

export const kFileSysInvalidEntry = -1;

/** @typedef {number} FsEntry */

// Note: FileSystem is a type in js stdlib
/**
 * @typedef {Object} FileSys
 * @property { () => FsEntry } rootEntry
 * @property { () => number } entriesCount
 * @property { (FsEntry) => FsEntry } entryParent
 * @property { (FsEntry) => boolean } entryIsDir
 * @property { (FsEntry) => string } entryName
 * @property { (FsEntry) => number } entrySize
 * @property { (FsEntry, number) => void } setEntrySize
 * @property { (FsEntry) => number } entryCreateTime
 * @property { (FsEntry) => number } entryModTime
 * @property { (FsEntry) => number[] } entryChildren
 * @property { (FsEntry) => number } entryDirCount
 * @property { (FsEntry) => number } entryFileCount
 * @property { (FsEntry) => any[] } entryMetaAll // returns all metadata
 * @property { (FsEntry, string, any) => any } entrySetMeta
 * @property { (FsEntry, string) => any } entryMeta
 * @property { (string) => number } internMetaKey
 * perf: when doing entryMeta frequently, save internMetaKey cost
 * by doing it once and using entryMetaByKeyIdx
 * @property { (FsEntry, number) => any } entryMetaByKeyIdx
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
  internMetaKey(key) {
    return internStringArray(this.metaKeys, key);
  }

  /**
   * @returns {number}
   */
  entriesCount() {
    let n = len(this.multiNumInfo);
    throwIf(n % kMultiNumPropsCount !== 0);
    return n / kMultiNumPropsCount;
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
    let keyIdx = this.internMetaKey(key);
    let mi = this.metaIndex;
    // this represents a linked list node that consists of 3 values:
    // key   : interned string as number
    // value : as index into metaValues array
    // next  : pointer to next node as index into metaIndex; -1 if last node
    let valMetaIdx = len(mi);
    // -1 is index of the next meta value for this entry
    // -1 means this is the last value
    // those indexes form a linked list
    mi.push(keyIdx, valIdx, -1);
    // chain
    let idx = e * kMultiNumPropsCount + kFirstMetaIdx;
    let currIdx = this.multiNumInfo[idx];
    throwIf(currIdx === undefined);
    if (currIdx === -1) {
      this.multiNumInfo[idx] = valMetaIdx;
      return;
    }
    // make new value first node in linked list
    mi[2] = currIdx; // set node.next to current first node
    this.multiNumInfo[idx] = valMetaIdx; // make this first node
  }

  /**
   * @param {FsEntry} e
   * @param {number} keyIdx
   * @returns {any} returns undefined if value not present
   */
  entryMetaByKeyIdx(e, keyIdx) {
    let idx = e * kMultiNumPropsCount + kFirstMetaIdx;
    // metaIdx is an index within metaIndex
    let metaIdx = this.multiNumInfo[idx];
    if (metaIdx === -1) {
      return undefined;
    }
    throwIf(metaIdx === undefined);
    let mi = this.metaIndex;
    // each element of metaIndex is 3 items:
    // keyIdx
    // valIdx
    // next     : linked list, index for next node in metaIndex, -1 if last
    while (metaIdx !== -1) {
      let keyIdx2 = mi[metaIdx];
      if (keyIdx2 === keyIdx) {
        let valIdx = mi[metaIdx + 1];
        return this.metaValues[valIdx];
      }
      metaIdx = mi[metaIdx + 2]; // index of next node
      throwIf(metaIdx === undefined);
    }
    return undefined;
  }
  /**
   * @param {FsEntry} e
   * @param {string} key
   * @returns {any} returns undefined if value not present
   */
  entryMeta(e, key) {
    let keyIdx = this.internMetaKey(key);
    return this.entryMetaByKeyIdx(e, keyIdx);
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
    let idx = e * kMultiNumPropsCount + kParentIdx;
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
    let idx = e * kMultiNumPropsCount + kSizeIdx;
    return this.multiNumInfo[idx];
  }

  /**
   * @param {FsEntry} e
   * @param {number} size
   */
  setEntrySize(e, size) {
    let idx = e * kMultiNumPropsCount + kSizeIdx;
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
    let idx = e * kMultiNumPropsCount + kModTimeIdx;
    return this.multiNumInfo[idx];
  }

  /**
   * @param {FsEntry} e
   * @returns {number}
   */
  entryModTime(e) {
    let idx = e * kMultiNumPropsCount + kModTimeIdx;
    return this.multiNumInfo[idx];
  }

  /**
   * @param {FsEntry} e
   * @returns {number[]}
   */
  entryChildren(e) {
    let res = this.children[e];
    throwIf(res === null); // not a directory
    return res;
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
   * @param {boolean} forDirs if true, returns count of directores, otherwise files
   * @returns {number}
   */
  _entryCountChildren(e, forDirs) {
    let c = this.children[e];
    throwIf(c === null, `e ${e} is not a directory`); // not a directory
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
   * return number of directories in a directory entry
   * @param {FsEntry} e
   * @returns {number}
   */
  entryDirCount(e) {
    return this._entryCountChildren(e, true);
  }

  /**
   * return number of files in a directory entry
   * @param {FsEntry} e
   * @returns {number}
   */
  entryFileCount(e) {
    return this._entryCountChildren(e, false);
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
 * call fn on each parent of e
 * @param {FileSys} fs
 * @param {FsEntry} e
 * @param {(FileSys, FsEntry) => void} fn
 */
export function forEachParent(fs, e, fn) {
  while (e != kFileSysInvalidEntry) {
    e = fs.entryParent(e);
    if (e !== kFileSysInvalidEntry) {
      fn(fs, e);
    }
  }
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

/**
 * @param {FileSys} fs
 * @param {FsEntry[]} entries
 */
export function sortEntries(fs, entries) {
  /**
   * @param {FsEntry} e1
   * @param {FsEntry} e2
   */
  function sortFn(e1, e2) {
    let e1Dir = fs.entryIsDir(e1);
    let e2Dir = fs.entryIsDir(e2);
    let name1 = fs.entryName(e1);
    let name2 = fs.entryName(e1);
    if (e1Dir && e2Dir) {
      return strCompareNoCase(name1, name2);
    }
    if (e1Dir || e2Dir) {
      return e1Dir ? -1 : 1;
    }
    return strCompareNoCase(name1, name2);
  }
  entries.sort(sortFn);
}

/**
 * call fn for each directory, starting with root and then
 * sub-directories recursively
 * fn return shouldContinue => if false, we won't visit subdirectories
 * @param { FileSys } fs
 * @param { (FileSys, FsEntry) => boolean } fn
 */
export function fsVisitDirs(fs, fn) {
  if (fs.entriesCount() === 0) {
    return;
  }
  let dirsToVisit = [fs.rootEntry()];
  while (len(dirsToVisit) > 0) {
    let dirEntry = dirsToVisit.shift();
    throwIf(dirEntry === -1);
    let cont = fn(fs, dirEntry);
    if (!cont) {
      // skip visiting sub-directories
      continue;
    }
    let children = fs.entryChildren(dirEntry);
    for (let e of children) {
      if (fs.entryIsDir(e)) {
        dirsToVisit.push(e);
      }
    }
  }
}

/**
 * traverse all directories and files starting from root
 * call fn on each file and directory in a depth-first traversal
 * @param {FileSys} fs
 * @param {(FileSys, FsEntry) => boolean} fn
 */
// export function fsVisit(fs, fn) {
//   if (fs.entriesCount() === 0) {
//     return;
//   }
//   let dirsToVisit = [fs.rootEntry()];
//   while (len(dirsToVisit) > 0) {
//     let dirEntry = dirsToVisit.shift();
//     let cont = fn(fs, dirEntry);
//     if (cont) {
//       continue;
//     }
//     let children = fs.entryChildren(dirEntry);
//     for (let e of children) {
//       fn(fs, e);
//       let isDir = fs.entryIsDir(e);
//       if (isDir) {
//         dirsToVisit.push(e);
//       }
//     }
//   }
// }

/**
 * traverse all directories and files starting from root
 * call fn on each file and directory in a depth-first traversal
 * @param {FileSys} fs
 * @param {(FileSys, FsEntry) => boolean} fn
 */
export function fsVisit(fs, fn) {
  function fnVisit(fs, de) {
    let cont = fn(fs, de);
    if (!cont) {
      return false;
    }
    let children = fs.entryChildren(de);
    for (let e of children) {
      if (!fs.entryIsDir(e)) {
        fn(fs, e);
      }
    }
    return true;
  }
  fsVisitDirs(fs, fnVisit);
}

/**
 * key is a name of a number meta value that must be set on file entries
 * we propagate this upwards:
 * - parent directory gets a sum of file meta values and sum of all sub-directories
 * @param {FileSys} fs
 * @param {string} key
 */
export function fsPropagateNumberMeta(fs, key) {
  let keyIdx = fs.internMetaKey(key);
  let nEntries = fs.entriesCount();
  // clear totals on directories to 0
  for (let de = 0; de < nEntries; de++) {
    if (fs.entryIsDir(de)) {
      fs.entrySetMeta(de, key, 0);
    }
  }

  for (let de = 0; de < nEntries; de++) {
    if (!fs.entryIsDir(de)) {
      continue;
    }
    let children = fs.entryChildren(de);
    let total = 0;
    for (let ce of children) {
      let isDir = fs.entryIsDir(ce);
      if (isDir) {
        continue;
      }
      let v = fs.entryMetaByKeyIdx(keyIdx);
      throwIf(v === undefined); // must be set
      total += v;
    }
    // propage to parent directories
    let e = de;
    while (e !== kFileSysInvalidEntry) {
      let curr = fs.entryMetaByKeyIdx(e, keyIdx);
      fs.entrySetMeta(e, curr + total);
      e = fs.entryParent(e);
    }
  }
}

/**
 * @callback FnFsEntryWithChildren
 * @param {FsEntry} e
 * @param {FsEntry[]} children
 */
