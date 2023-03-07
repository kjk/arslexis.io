// https://www.npmjs.com/package/idb

import { KV } from "../dbutil";
import { len, throwIf } from "../util";
import { FsFile, fsTypeFolder, fsTypeIndexedDB, setIDB } from "./FsFile";

const db = new KV("np2store", "keyval");

// TODO: not great, needed to avoid circular dependencies
setIDB(db);

/**
 * @typedef {Object} FavEntry
 * @property {string} fs
 * @property {string} name
 * @property {string} id
 * @property {FileSystemFileHandle} fileHandle
 * @property {string} favName
 */

/**
 * @param {FsFile} file
 * @param {string} favName
 * @returns {FavEntry}
 */
export function favEntryFromFsFile(file, favName) {
  /** @type {FavEntry} */
  const e = {
    fs: file.type,
    name: file.name,
    favName: favName,
    id: file.id,
    fileHandle: file.fileHandle,
  };
  return e;
}

/**
 * @param {FavEntry} fav
 * @returns {FsFile}
 */
export function fsFileFromFavEntry(fav) {
  const name = fav.name; // or fav.favName?
  const f = new FsFile(fav.fs, name, name);
  f.fileHandle = fav.fileHandle;
  f.id = fav.id;
  return f;
}

/**
 * @param {FavEntry} e1
 * @param {FavEntry} e2
 * @returns {Promise<boolean>}
 */
export async function favEq(e1, e2) {
  if (e1.fs !== e2.fs) return false;
  if (e1.name !== e2.name) return false;
  if (e1.favName !== e2.favName) return false;
  switch (e1.fs) {
    case fsTypeIndexedDB:
      return e1.id === e2.id;
    case fsTypeFolder:
      const eq = await e1.fileHandle.isSameEntry(e2.fileHandle);
      return eq;
  }
  throwIf(true, `unknown e1.fs: '${e1.fs}`);
  return false;
}

const keyFileForNewWindow = "file-for-new-window";

/**
 * @param {FsFile} f
 */
export async function rememberFileForNewWindow(f) {
  const e = favEntryFromFsFile(f, f.name);
  await db.set(keyFileForNewWindow, e);
}

/**
 * @returns {Promise<FsFile>}
 */
export async function getAndClearFileForNewWindow() {
  const fav = await db.get(keyFileForNewWindow);
  const f = fsFileFromFavEntry(fav);
  await db.del(keyFileForNewWindow);
  return f;
}

/**
 * Create a generic Svelte store persisted in IndexedDB
 * @param {string} dbKey unique IndexedDB key for storing this value
 * @param {any} initialValue
 * @param {boolean} crossTab if true, changes are visible in other browser tabs (windows)
 * @returns {any}
 */
function makeIndexedDBStore(dbKey, initialValue, crossTab) {
  function makeStoreMaker(dbKey, initialValue, crossTab) {
    const lsKey = "store-notify:" + dbKey;
    let curr = initialValue;
    const subscribers = new Set();

    function getCurrentValue() {
      db.get(dbKey).then((v) => {
        curr = v || [];
        subscribers.forEach((cb) => cb(curr));
      });
    }

    getCurrentValue();

    /**
     * @param {StorageEvent} event
     */
    function storageChanged(event) {
      if (event.storageArea === localStorage && event.key === lsKey) {
        getCurrentValue();
      }
    }
    if (crossTab) {
      window.addEventListener("storage", storageChanged, false);
    }

    function set(v) {
      curr = v;
      subscribers.forEach((cb) => cb(curr));
      db.set(dbKey, v).then((v) => {
        if (crossTab) {
          const n = +localStorage.getItem(lsKey) || 0;
          localStorage.setItem(lsKey, `${n + 1}`);
        }
      });
    }

    /**
     * @param {Function} subscriber
     */
    function subscribe(subscriber) {
      subscriber(curr);
      subscribers.add(subscriber);
      function unsubscribe() {
        subscribers.delete(subscriber);
      }
      return unsubscribe;
    }

    return { set, subscribe };
  }
  return makeStoreMaker(dbKey, initialValue, crossTab);
}

/**
 * an array of FileSystemDirectoryHandle for remembering
 * opened folders in DialogBrowse
 */
export let browseFolders = makeIndexedDBStore("browse-folders", [], true);

export let recent = makeIndexedDBStore("recent", [], true);

export let favorites = makeIndexedDBStore("favorites", [], true);
