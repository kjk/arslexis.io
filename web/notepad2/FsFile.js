/** @typedef {import("../dbutil").KV} KV */
import { verifyHandlePermission } from "../fileutil";
import { genRandomID, splitMax, throwIf } from "../util";

export const fsTypeIndexedDB = "idb";
export const fsTypeComputer = "computer'";

export class FsFile {
  type = "";
  // id must be unique
  id = "";
  // name doesn't have to be unique
  name = "";
  /** @type {FileSystemFileHandle} */
  fileHandle;
  /**
   * @param {string} id
   * @param {string} [name]
   */
  constructor(type, id, name) {
    this.type = type;
    this.id = id;
    this.name = name || "";
  }
}

/** @type {KV} */
let db;

/**
 * @param {KV} idb
 */
export function setIDB(idb) {
  db = idb;
}

// format of the key is:
// np2:file:${id}:${name}
const idbKeyPrefix = "np2:file:";

/**
 * must have id and name set
 * @param {FsFile} f
 * @result {string}
 */
function mkIDBKey(f) {
  return idbKeyPrefix + f.id + ":" + f.name;
}

export function newIndexedDBFile(name) {
  let id = genRandomID(6);
  let f = new FsFile(fsTypeIndexedDB, id, name);
  f.type = fsTypeIndexedDB;
  return f;
}

// TODO: could store file list under a single key + content
/**
 * @returns {Promise<FsFile[]>}
 */
async function getFileListIndexedDB() {
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

/**
 * must have id and name set
 * @param {FsFile} f
 * @returns {string}
 */
export function serialize(f) {
  switch (f.type) {
    case fsTypeIndexedDB:
      return "ls--" + f.id + "--" + f.name;
  }
  throwIf(true, `invalid FsFile.type ${f.type}`);
}

/**
 * @param {string} s
 * @returns {?FsFile}
 */
export function deserialize(s) {
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

/**
 * @param {FsFile} f
 * @returns {Promise<Blob>}
 */
async function readFileIndexedDB(f) {
  const key = mkIDBKey(f);
  const d = await db.get(key);
  return d;
}

/**
 * @param {FsFile} f
 * @returns {Promise<Blob>}
 */
async function readFileComputer(f) {
  const fh = f.fileHandle;
  const ok = await verifyHandlePermission(fh, false);
  if (!ok) {
    return null;
  }
  const d = await fh.getFile();
  return d;
}

/**
 * must have id and name set
 * @param {FsFile} f
 * @returns {Promise<Blob>}
 */
export async function readFile(f) {
  switch (f.type) {
    case fsTypeIndexedDB:
      return await readFileIndexedDB(f);
    case fsTypeComputer:
      return await readFileComputer(f);
    default:
      throwIf(true, `f.type '${f.type}' not recognized`);
  }
  return null;
}

/**
 * @param {FsFile} f
 * @param {Blob} d
 */
async function writeFileComputer(f, d) {
  const fileHandle = f.fileHandle;
  // @ts-ignore
  const writable = await fileHandle.createWritable();
  await writable.write(d);
  await writable.close();
}

/**
 * @param {FsFile} f
 * @param {Blob} d
 */
async function writeFileIndexedDB(f, d) {
  const key = mkIDBKey(f);
  await db.set(key, d);
}

/**
 * @param {FsFile} f
 * @param {Blob} d
 */
export async function writeFile(f, d) {
  throwIf(!(d instanceof Blob));
  switch (f.type) {
    case fsTypeIndexedDB:
      writeFileIndexedDB(f, d);
      break;
    case fsTypeComputer:
      await writeFileComputer(f, d);
      break;
    default:
      throwIf(true, `invalid FsFile.type ${f.type}`);
  }
}

/**
 * return array of FsFile objects without objects
 * @param {string} type
 * @returns {Promise<FsFile[]>}
 */
export async function getFileList(type) {
  switch (type) {
    case fsTypeIndexedDB:
      return await getFileListIndexedDB();
    default:
      throwIf(true, `invalid FsFile.type ${type}`);
  }
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker
 * @returns {Promise<FsFile>}
 */
export async function openFilePicker() {
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
  let res = new FsFile(fsTypeComputer, name, name);
  res.fileHandle = fileHandle;
  return res;
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker
 * @returns {Promise<FsFile>}
 */
export async function saveFilePicker(suggestedName = "") {
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
  let res = new FsFile(fsTypeComputer, name, name);
  res.fileHandle = fileHandle;
  return res;
}
