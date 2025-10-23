type KV = import("../dbutil").KV;
import { verifyHandlePermission } from "../fileutil";
import { genRandomID, splitMax, throwIf } from "../util";

export const fsTypeIndexedDB = "idb";
export const fsTypeFolder = "computer'";

export class FsFile {
  type = "";
  // id must be unique
  id = "";
  // name doesn't have to be unique
  name = "";
  fileHandle: FileSystemFileHandle;
  constructor(type: string, id: string, name?: string) {
    this.type = type;
    this.id = id;
    this.name = name || "";
  }
}

let db: KV;

export function setIDB(idb: KV) {
  db = idb;
}

// format of the key is:
// np2:file:${id}:${name}
const idbKeyPrefix = "np2:file:";

function mkIDBKey(f: FsFile): string {
  return idbKeyPrefix + f.id + ":" + f.name;
}

export function newIndexedDBFile(name: string): FsFile {
  let id = genRandomID(6);
  let f = new FsFile(fsTypeIndexedDB, id, name);
  f.type = fsTypeIndexedDB;
  return f;
}

// TODO: could store file list under a single key + content
async function getFileListIndexedDB(): Promise<FsFile[]> {
  let keys = await db.keys();
  const res = [];
  for (const dbKey of keys) {
    const key = dbKey.toString();
    if (!key.startsWith(idbKeyPrefix)) {
      continue;
    }
    const parts = key.split(":", 4);
    console.log("getFileListLocalStorage: parts:", parts);
    let id = parts[2];
    let name = parts[3];
    const f = new FsFile(fsTypeIndexedDB, id, name);
    console.log("getFileListIndexedDB:", f);
    res.push(f);
  }
  return res;
}

export function serialize(f: FsFile): string {
  switch (f.type) {
    case fsTypeIndexedDB:
      return "ls--" + f.id + "--" + f.name;
  }
  throwIf(true, `invalid FsFile.type ${f.type}`);
}

export function deserialize(s: string): FsFile | null {
  let parts = splitMax(s, "--", 3);
  let type = parts[0];
  switch (type) {
    case "ls":
      let id = parts[1];
      let name = parts[2];
      console.log("deserialize: id=", id, "name:", name);
      return new FsFile(fsTypeIndexedDB, id, name);
    default:
      // comes from the user so only logging
      console.log(`FsFile:deserialize: invalid type '${type}' in '${s}'`);
  }
  return null;
}

async function deleteFileIndexedDB(f: FsFile): Promise<boolean> {
  const key = mkIDBKey(f);
  try {
    await db.del(key);
  } catch (e) {
    console.log("deleteIndexedDB:", e);
    return false;
  }
  return true;
}

async function deleteFileComputer(f: FsFile): Promise<boolean> {
  const fh = f.fileHandle;
  const ok = await verifyHandlePermission(fh, true);
  if (!ok) {
    return null;
  }
  // needs parent directory to implement?
  throwIf(true, "NYI");
  return true;
}

export async function deleteFile(f: FsFile): Promise<boolean> {
  switch (f.type) {
    case fsTypeIndexedDB:
      return await deleteFileIndexedDB(f);
    case fsTypeFolder:
      return await deleteFileComputer(f);
    default:
      throwIf(true, `f.type '${f.type}' not recognized`);
  }
  return null;
}

async function readFileIndexedDB(f: FsFile): Promise<Blob> {
  const key = mkIDBKey(f);
  const d = await db.get(key);
  return d;
}

async function readFileComputer(f: FsFile): Promise<Blob> {
  const fh = f.fileHandle;
  const ok = await verifyHandlePermission(fh, false);
  if (!ok) {
    return null;
  }
  // can throw an exception if file has been removed
  try {
    const d = await fh.getFile();
    return d;
  } catch (e) {
    console.log("readFileComputer: e:", e);
  }
  return null;
}

export async function readFile(f: FsFile): Promise<Blob> {
  switch (f.type) {
    case fsTypeIndexedDB:
      return await readFileIndexedDB(f);
    case fsTypeFolder:
      return await readFileComputer(f);
    default:
      throwIf(true, `f.type '${f.type}' not recognized`);
  }
  return null;
}

async function writeFileComputer(f: FsFile, d: Blob) {
  const fileHandle = f.fileHandle;
  // @ts-ignore
  const writable = await fileHandle.createWritable();
  await writable.write(d);
  await writable.close();
}

async function writeFileIndexedDB(f: FsFile, d: Blob) {
  const key = mkIDBKey(f);
  await db.set(key, d);
}

export async function writeFile(f: FsFile, d: Blob) {
  throwIf(!(d instanceof Blob));
  switch (f.type) {
    case fsTypeIndexedDB:
      writeFileIndexedDB(f, d);
      break;
    case fsTypeFolder:
      await writeFileComputer(f, d);
      break;
    default:
      throwIf(true, `invalid FsFile.type ${f.type}`);
  }
}

export async function getFileList(type: string): Promise<FsFile[]> {
  switch (type) {
    case fsTypeIndexedDB:
      return await getFileListIndexedDB();
    default:
      throwIf(true, `invalid FsFile.type ${type}`);
  }
}

export async function openFilePicker(): Promise<FsFile> {
  const opts = {
    mutltiple: false,
  };
  let fileHandle;
  try {
    // @ts-ignore
    const files = await window.showOpenFilePicker(opts);
    fileHandle = files[0];
  } catch (e) {
    console.log("openFilePicker: showOpenFilePicker: e:", e);
    return null;
  }
  let name = fileHandle.name;
  let res = new FsFile(fsTypeFolder, name, name);
  res.fileHandle = fileHandle;
  return res;
}

export async function saveFilePicker(suggestedName: string = ""): Promise<FsFile> {
  const opts = {
    suggestedName: suggestedName,
    mutltiple: false,
  };
  let fileHandle;
  try {
    // @ts-ignore
    fileHandle = await window.showSaveFilePicker(opts);
  } catch (e) {
    console.log("saveFilePicker: showSaveFilePicker: e:", e);
    return null;
  }
  let name = fileHandle.name;
  let res = new FsFile(fsTypeFolder, name, name);
  res.fileHandle = fileHandle;
  return res;
}
