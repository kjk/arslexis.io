/*
Abstraction for file system with an eye for close to optimal performance
and being able to represent various kinds of filesystem (disk, s3 etc.).

FileSystem entries are represented by an opaque handle (a number).
*/

import { len } from "./util";

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
 * @property { (Fsentry) => number[] } entryChildren
 * @property { (Fsentry) => number[] } entryDirs
 * @property { (Fsentry) => number[] } entryFiles
 */

// index withing multiNumInfo flat array
const kSizeIdx = 0;
const kModTimeIdx = 1;
const kCreateTimeIdx = 2;
const kParentIdx = 3;
const kMultiNumPropsCount = 4;

/**
 * Efficient implementation of storing info about direcotry
 * @implements {FileSys}
 */
export class FileSystemDir {
  /** @type {string[]} */
  names = [];
  /** @type {number[]} */
  multiNumInfo = [];

  // TODO: optimize as a flat array and keeping info
  // as index / length into the array
  // if value is null, it's directory
  //
  /** @type {number[][]} */
  children = [];

  /**
   * @returns {FsEntry}
   */
  rootEntry() {
    if (len(this.names) === 0) {
      return -1;
    }
    return 0;
  }

  /**
   * @param {FsEntry} e
   * @returns {FsEntry}
   */
  entryParent(e) {
    if (e == 0) {
      return -1;
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
    let idx = kMultiNumPropsCount * e + kCreateTimeIdx;
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
   * @returns {number[]}
   */
  entryDirs(e) {
    let c = this.children[e];
    let n = len(c);
    // TODO(perf): pre-allcoate res
    // TODO(perf): alternatively, ensure that dirs are always first
    // so we can just find the index of first file entry and
    // return subarrays
    /** @type {number[]} */
    let res = [];
    for (let i = 0; i < n; i++) {
      let e = c[i];
      if (this.entryIsDir(e)) {
        res.push(e);
      }
    }
    return res;
  }

  /**
   * @param {FsEntry} e
   * @returns {number[]}
   */
  entryFiles(e) {
    let c = this.children[e];
    let n = len(c);
    // TODO(perf): pre-allcoate res
    /** @type {number[]} */
    let res = [];
    for (let i = 0; i < n; i++) {
      let e = c[i];
      if (!this.entryIsDir(e)) {
        res.push(e);
      }
    }
    return res;
  }
}
