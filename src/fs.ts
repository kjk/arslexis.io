/*
Abstraction for file system with an eye for close to optimal performance
and being able to represent various kinds of filesystem (disk, s3 etc.).

FileSystem entries are represented by an opaque handle (a number).
*/

import { internStringArray, len, throwIf } from "./util";

import { strCompareNoCase } from "./strutil";

export const kFileSysInvalidEntry = -1;

export type FsEntry = number;

// Note: named FileSys because FileSystem is a type in js stdlib
export type FileSys = {
  rootEntry: () => FsEntry;
  entriesCount: () => number;
  entryParent: (FsEntry) => FsEntry;
  entryIsDir: (FsEntry) => boolean;
  entryName: (FsEntry) => string;
  entrySize: (FsEntry) => number;
  entryCreateTime: (FsEntry) => number;
  entryModTime: (FsEntry) => number;
  entryChildren: (FsEntry) => FsEntry[];
  entryDirCount: (FsEntry) => number;
  entryFileCount: (FsEntry) => number;
  entrySetMeta: (FsEntry, string, any) => any;
  entryMeta: (FsEntry, string) => any;
  // perf: cache for use in entryMetaByKeyIdx
  internMetaKey: (string) => number;
  // perf: when doing entryMeta frequently, save internMetaKey cost
  // by doing entryMetaByKeyIdx
  entryMetaByKeyIdx: (FsEntry, number) => any;
};

// index withing entryInfo flat array
const kParentIdx = 0;
const kSizeIdx = 1;
const kModTimeIdx = 2;
const kFirstMetaIdx = 3;
const kEntryInfoCount = 4;

/**
 * Efficient implementation of storing info about direcotry
 * @implements {FileSys}
 */
export class FileSysDir {
  names: string[] = [];
  handles: FileSystemDirectoryHandle[] = [];

  // each entry is represented by kEntryInfoCount numbers
  entryInfo: number[] = [];

  // this array interns keys used for meta values
  // it should be very short, because there shouldn't be
  // many unique meta values
  metaKeys: string[] = [];

  // entryInfo[kFirstMetaIdx] is an idx into metaIndex
  // first element is interned key returned by internMetaKey(key)
  // second element is index into metaValues
  // third is idx into metaIndex and implements linked list of meta values
  //       if -1, this is the last value
  metaIndex: number[] = [];

  metaValues: any[] = [];

  // TODO: optimize as a flat array and keeping info
  // as index / length into the array
  // if value is null, it's directory
  children: FsEntry[][] = [];

  internMetaKey(key: string): number {
    return internStringArray(this.metaKeys, key);
  }

  entriesCount(): number {
    let n = len(this.entryInfo);
    throwIf(n % kEntryInfoCount !== 0);
    return n / kEntryInfoCount;
  }

  entrySetMeta(e: FsEntry, key: string, val: any) {
    let keyIdx = this.internMetaKey(key);
    // if exists, replace value
    let idx = e * kEntryInfoCount + kFirstMetaIdx;
    let currIdx = this.entryInfo[idx];
    throwIf(currIdx === undefined);
    let mi = this.metaIndex;
    while (currIdx !== -1) {
      let currKeyIdx = mi[currIdx + 0];
      if (currKeyIdx === keyIdx) {
        let valIdx = mi[currIdx + 1];
        this.metaValues[valIdx] = val;
        return;
      }
      currIdx = mi[currIdx + 2]; // idx of next node in linked list
    }

    // append new value
    let valIdx = len(this.metaValues);
    this.metaValues.push(val);
    // this represents a linked list node that consists of 3 values:
    // key   : interned string as number
    // value : as index into metaValues array
    // next  : pointer to next node as index into metaIndex; -1 if last node
    let metaIdx = len(mi);
    // -1 is index of the next meta value for this entry
    // -1 means this is the last value
    // those indexes form a linked list
    mi.push(keyIdx, valIdx, -1);

    // make new value (metaIdx) first node in linked list
    idx = e * kEntryInfoCount + kFirstMetaIdx;
    currIdx = this.entryInfo[idx];
    throwIf(currIdx === undefined);
    if (currIdx === -1) {
      this.entryInfo[idx] = metaIdx;
      return;
    }
    mi[metaIdx + 2] = currIdx; // set node.next to current first node
    this.entryInfo[idx] = metaIdx; // make this first node
  }

  entryMetaByKeyIdx(e: FsEntry, keyIdx: number): any {
    let idx = e * kEntryInfoCount + kFirstMetaIdx;
    // metaIdx is an index within metaIndex
    let metaIdx = this.entryInfo[idx];
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
  entryMeta(e: FsEntry, key: string): any {
    let keyIdx = this.internMetaKey(key);
    return this.entryMetaByKeyIdx(e, keyIdx);
  }

  rootEntry(): FsEntry {
    if (len(this.names) === 0) {
      return kFileSysInvalidEntry;
    }
    return 0;
  }

  entryParent(e: FsEntry): FsEntry {
    if (e == 0) {
      return kFileSysInvalidEntry;
    }
    let idx = e * kEntryInfoCount;
    return this.entryInfo[idx + kParentIdx];
  }

  entryName(e: FsEntry): string {
    return this.names[e];
  }

  entrySize(e: FsEntry): number {
    let idx = e * kEntryInfoCount;
    return this.entryInfo[idx + kSizeIdx];
  }

  setEntrySize(e: FsEntry, size: number) {
    let idx = e * kEntryInfoCount;
    this.entryInfo[idx + kSizeIdx] = size;
  }

  entryIsDir(e: FsEntry): boolean {
    let children = this.children[e];
    return children !== null;
  }

  entryCreateTime(e: FsEntry): number {
    // browser API doesn't provide creation time so we re-use mod time
    let idx = e * kEntryInfoCount;
    return this.entryInfo[idx + kModTimeIdx];
  }

  entryModTime(e: FsEntry): number {
    let idx = e * kEntryInfoCount;
    return this.entryInfo[idx + kModTimeIdx];
  }

  entryChildren(e: FsEntry): FsEntry[] {
    let res = this.children[e];
    throwIf(res === null); // not a directory
    return res;
  }

  async entryFileHandle(e: FsEntry): Promise<FileSystemFileHandle> {
    let isDir = this.entryIsDir(e);
    throwIf(isDir);
    let name = this.entryName(e);
    let parent = this.entryParent(e);
    let dh = this.handles[parent];
    return await dh.getFileHandle(name);
  }

  entryDirHandle(e: FsEntry): FileSystemDirectoryHandle {
    let isDir = this.entryIsDir(e);
    throwIf(isDir);
    return this.handles[e];
  }

  _entryCountChildren(e: FsEntry, forDirs: boolean): number {
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

  entryDirCount(e: FsEntry): number {
    return this._entryCountChildren(e, true);
  }

  entryFileCount(e: FsEntry): number {
    return this._entryCountChildren(e, false);
  }

  allocEntry(
    parent: FsEntry,
    name: string,
    handle: FileSystemDirectoryHandle,
  ): FsEntry {
    let e = len(this.names);
    this.names.push(name);
    this.handles.push(handle);
    this.children.push(null);
    let oldSize = len(this.entryInfo);
    this.entryInfo.push(parent, -1, -1, -1);
    let newSize = len(this.entryInfo);
    throwIf(newSize != oldSize + kEntryInfoCount);
    return e;
  }
}

export type ReadFilesCbArgs = {
  fs: FileSysDir;
  dirName: string;
  fileCount: number;
  dirCount: number;
  totalSize: number;
  finished: boolean;
};

type readFileSysDirCallback = (args: ReadFilesCbArgs) => boolean;

export async function readFileSysDirRecur(
  dirHandle: FileSystemDirectoryHandle,
  progress: readFileSysDirCallback,
): Promise<FileSysDir> {
  let fs = new FileSysDir();
  let name = dirHandle.name;
  let entry = fs.allocEntry(kFileSysInvalidEntry, name, dirHandle);
  let dirsToVisit: FsEntry[] = [entry];
  let nDirs = 0;
  let nFiles = 0;
  let totalSize = 0;
  while (len(dirsToVisit) > 0) {
    let parent = dirsToVisit.shift();
    dirHandle = fs.handles[parent];
    if (nDirs % 10 == 0) {
      let arg: ReadFilesCbArgs = {
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
    // @ts-ignore
    for await (const fshandle of dirHandle.values()) {
      name = fshandle.name;
      let isDir = fshandle.kind === "directory";
      let isFile = fshandle.kind === "file";
      // perf: only store handle for directories
      // we need it to access files
      let h = null;
      if (isDir) {
        h = fshandle as FileSystemDirectoryHandle;
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
        let f = (await fshandle.getFile()) as File;
        let info = fs.entryInfo;
        let idx = echild * kEntryInfoCount;
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

function calcDirSizeRecur(fs: FileSysDir, e: FsEntry): number {
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

export function calcDirSizes(fs: FileSysDir) {
  let root = fs.rootEntry();
  calcDirSizeRecur(fs, root);
}

export function entryPath(fs: FileSys, e: FsEntry): FsEntry[] {
  let res = [];
  while (e !== kFileSysInvalidEntry) {
    res.push(e);
    e = fs.entryParent(e);
  }
  res.reverse();
  return res;
}

export function forEachParent(
  fs: FileSys,
  e: FsEntry,
  fn: (fs: FileSys, e: FsEntry) => void,
) {
  while (e != kFileSysInvalidEntry) {
    e = fs.entryParent(e);
    if (e !== kFileSysInvalidEntry) {
      fn(fs, e);
    }
  }
}

export function entryFullPath(fs: FileSys, e: FsEntry): string {
  let parts = [];
  while (e !== kFileSysInvalidEntry) {
    let name = fs.entryName(e);
    parts.push(name);
    e = fs.entryParent(e);
  }
  parts.reverse();
  return parts.join("/");
}

export function sortEntries(fs: FileSys, entries: FsEntry[]) {
  function sortFn(e1: FsEntry, e2: FsEntry) {
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

export function fsVisitDirs(
  fs: FileSys,
  fn: (fs: FileSys, e: FsEntry) => boolean,
) {
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

export function fsVisit(fs: FileSys, fn: (fs: FileSys, e: FsEntry) => boolean) {
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

export function fsPropagateNumberMeta(fs: FileSys, key: string) {
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
      let v = fs.entryMetaByKeyIdx(de, keyIdx);
      throwIf(v === undefined); // must be set
      total += v;
    }
    // propagate to parent directories
    let e = de;
    while (e !== kFileSysInvalidEntry) {
      let curr = fs.entryMetaByKeyIdx(e, keyIdx);
      fs.entrySetMeta(e, key, curr + total);
      e = fs.entryParent(e);
    }
  }
}

type FnFsEntryWithChildren = (e: FsEntry, children: FsEntry[]) => void;
