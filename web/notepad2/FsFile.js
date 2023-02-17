import { genRandomID, splitMax, throwIf } from "../util";

export const fsTypeLocalStorage = "localstorage";

export class FsFile {
  type = "";
  // id must be unique
  id = "";
  // name doesn't have to be unique
  name = "";
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

// format of the key is:
// np2:file:${id}:${name}
const lsKeyPrefix = "np2:file:";

/**
 * must have id and name set
 * @param {FsFile} f
 * @result {string}
 */
function mkLSKey(f) {
  return lsKeyPrefix + f.id + ":" + f.name;
}

export function newLocalStorageFile(name) {
  let id = genRandomID(6);
  let f = new FsFile(fsTypeLocalStorage, id, name);
  f.type = fsTypeLocalStorage;
  return f;
}

/**
 * @returns {FsFile[]}
 */
function getFileListLocalStorage() {
  const nKeys = localStorage.length;
  const res = [];
  for (let i = 0; i < nKeys; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith(lsKeyPrefix)) {
      continue;
    }
    const parts = key.split(":", 4);
    console.log("getFileListLocalStorage: parts:", parts);
    let id = parts[2];
    let name = parts[3];
    const f = new FsFile(fsTypeLocalStorage, id, name);
    f.type = fsTypeLocalStorage;
    console.log("getFileListLocalStorage:", f);
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
    case fsTypeLocalStorage:
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
      return new FsFile(fsTypeLocalStorage, id, name);
    default:
      // comes from the user so only logging
      console.log(`FsFile:deserialize: invalid type '${type}' in '${s}'`);
  }
  return null;
}

/**
 * must have id and name set
 * @param {FsFile} f
 * @returns {string}
 */
export function readFile(f) {
  throwIf(f.type !== fsTypeLocalStorage);
  const key = mkLSKey(f);
  const content = localStorage.getItem(key);
  return content;
}

/**
 * @param {FsFile} f
 * @param {string} content
 */
export function writeFile(f, content) {
  switch (f.type) {
    case fsTypeLocalStorage:
      const key = mkLSKey(f);
      localStorage.setItem(key, content);
      break;
    default:
      throwIf(true, `invalid FsFile.type ${f.type}`);
  }
}

/**
 * return array of FsFile objects without objects
 * @param {string} type
 * @returns {FsFile[]}
 */
export function getFileList(type) {
  switch (type) {
    case fsTypeLocalStorage:
      return getFileListLocalStorage();
    default:
      throwIf(true, `invalid FsFile.type ${type}`);
  }
}
