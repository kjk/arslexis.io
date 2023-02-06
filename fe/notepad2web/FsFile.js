import { throwIf } from "../util";

export const fsTypeLocalStorage = "localstorage";

class FsFile {
  type = fsTypeLocalStorage;
  // id must be unique
  id = "";
  // name doesn't have to be unique
  name = "";
  content = "";
}

/**
 * @param {FsFile} file
 */
export function saveFile(file) {
  throwIf(file.type !== fsTypeLocalStorage);
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

/**
 * @result {FsFile[]}
 */
function getFileListLocalStorage() {
  const nKeys = localStorage.length;
  let res = [];
  for (let i = 0; i < nKeys; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(lsKeyPrefix)) {
      continue;
    }
    const parts = key.split(key, 4);
    let f = new FsFile();
    f.id = parts[2];
    f.name = parts[3];
    res.push(f);
  }
  return res;
}

/**
 * must have id and name set
 * @param {FsFile} f
 * @result {string}
 */
export function readFile(f) {
  throwIf(f.type !== fsTypeLocalStorage);
  const key = mkLSKey(f);
  const content = localStorage.getItem(key);
  return content;
}

/**
 * @param {FsFile} f
 * @result {FsFile}
 */
export function writeFile(f) {
  throwIf(f.type !== fsTypeLocalStorage);
  const key = mkLSKey(f);
  localStorage.setItem(key, f.content);
}

/**
 * return array of FsFile objects without objects
 * @param {string} type
 * @result {FsFile[]}
 */
export function getFileList(type) {
  throwIf(type !== fsTypeLocalStorage);
  return getFileListLocalStorage();
}
