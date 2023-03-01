import { genRandomID, splitMax, throwIf } from "../util";

export const fsTypeLocalStorage = "localstorage";
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
 * @param {FsFile} f
 */
function readFileLocalStorage(f) {
  const key = mkLSKey(f);
  const content = localStorage.getItem(key);
  return content;
}

/**
 * @param {FsFile} f
 * @returns {Promise<string>}
 */
async function readFileComputer(f) {
  const fh = f.fileHandle;
  const d = await fh.getFile();
  const ab = await d.arrayBuffer();
  const res = new TextDecoder().decode(ab);
  return res;
}

/**
 * must have id and name set
 * @param {FsFile} f
 * @returns {Promise<string>}
 */
export async function readFile(f) {
  switch (f.type) {
    case fsTypeLocalStorage:
      return readFileLocalStorage(f);
    case fsTypeComputer:
      return await readFileComputer(f);
    default:
      throwIf(true, `f.type '${f.type}' not recognized`);
  }
  return "";
}

async function writeFileComputer(f, contents) {
  const fileHandle = f.fileHandle;
  const writable = await fileHandle.createWritable();
  await writable.write(contents);
  await writable.close();
}

function writeFileLocalStorage(f, content) {
  const key = mkLSKey(f);
  localStorage.setItem(key, content);
}

/**
 * @param {FsFile} f
 * @param {string} content
 */
export async function writeFile(f, content) {
  switch (f.type) {
    case fsTypeLocalStorage:
      writeFileLocalStorage(f, content);
      break;
    case fsTypeComputer:
      await writeFileComputer(f, content);
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
