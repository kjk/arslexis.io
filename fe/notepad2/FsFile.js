import { genRandomID, throwIf } from "../util";

export const fsTypeLocalStorage = "localstorage";

export class FsFile {
  type = fsTypeLocalStorage;
  // id must be unique
  id = "";
  // name doesn't have to be unique
  name = "";
  content = "";
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
  let f = new FsFile();
  f.type = fsTypeLocalStorage;
  f.name = name;
  f.id = genRandomID(6);
  f.content = "";
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
    const f = new FsFile();
    f.id = parts[2];
    f.name = parts[3];
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
export function readFile(f) {
  throwIf(f.type !== fsTypeLocalStorage);
  const key = mkLSKey(f);
  const content = localStorage.getItem(key);
  return content;
}

/**
 * @param {FsFile} file
 * @param {string} content
 */
function saveFileLocalStorage(file, content) {
  const key = mkLSKey(file);
  localStorage.setItem(key, content);
  file.content = content;
}

/**
 * @param {FsFile} file
 * @param {string} content
 */
export function saveFile(file, content) {
  console.log("saveFile:", file);
  switch (file.type) {
    case fsTypeLocalStorage:
      saveFileLocalStorage(file, content);
      break;
    default:
      throwIf(true);
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
      throwIf(true);
  }
}
