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
  get name(): string {
    return this[handleIdx].name;
  }

  get isDir(): boolean {
    return this[handleIdx].kind === "directory";
  }

  get size(): number {
    return this[sizeIdx];
  }

  set size(n: number) {
    throwIf(!this.isDir);
    this[sizeIdx] = n;
  }

  get path(): string {
    return this[pathIdx];
  }

  set path(v: string) {
    this[pathIdx] = v;
  }

  get meta(): any {
    return this[metaIdx];
  }

  set meta(o: any) {
    this[metaIdx] = o;
  }

  async getFile(): Promise<File> {
    throwIf(this.isDir);
    let h = this[handleIdx];
    return await h.getFile();
  }

  getMeta(key: string): any {
    let m = this[metaIdx];
    return m ? m[key] : undefined;
  }

  setMeta(key: string, val: any) {
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

  get dirEntries(): FsEntry[] {
    throwIf(!this.isDir);
    return this[dirEntriesIdx];
  }

  set dirEntries(v: FsEntry[]) {
    throwIf(!this.isDir);
    this[dirEntriesIdx] = v;
  }

  static async fromHandle(handle: any, parentHandle: any, path: string): Promise<FsEntry> {
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

export async function readDir(
  dirHandle: FileSystemDirectoryHandle,
  skipEntryFn: Function = dontSkip,
  dir: string = dirHandle.name
): Promise<FsEntry> {
  let entries: FsEntry[] = [];
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

export async function readDirRecurFiles(dirHandle: FileSystemDirectoryHandle, dir: string = dirHandle.name): Promise<File[]> {
  const dirs = [];
  const files = [];
  for await (const entry of dirHandle.values()) {
    const path = dir == "" ? entry.name : `${dir}/${entry.name}`;
    if (entry.kind === "file") {
      let fh = entry as FileSystemFileHandle;
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
      let dh = entry as FileSystemDirectoryHandle;
      dirs.push(readDirRecurFiles(dh, path));
    }
  }
  return [...(await Promise.all(dirs)).flat(), ...(await Promise.all(files))];
}
