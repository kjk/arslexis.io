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

// TODO: expose as svelte store

/**
 * @param {FavEntry} e1
 * @param {FavEntry} e2
 * @returns {Promise<boolean>}
 */
async function favEq(e1, e2) {
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

/**
 * @param {string} key
 * @returns {Promise<FavEntry[]>}
 */
export async function getFavs(key) {
  return (await db.get(key)) || [];
}

/**
 * @param {string} key
 * @param {FavEntry[]} v
 */
export async function setFavs(key, v) {
  await db.set(key, v);
}

/**
 * @param {string} key
 * @param {FavEntry} e
 * @returns {Promise<FavEntry[]>}
 */
export async function removeFav(key, e) {
  let entries = await getFavs(key);
  let newEntries = [];
  for (const ee of entries) {
    const eq = await favEq(ee, e);
    if (!eq) newEntries.push(ee);
  }
  if (len(entries) === len(newEntries) + 1) {
    await setFavs(key, newEntries);
  } else {
    console.log(
      "removeFav: didn't remove! entries:",
      entries,
      "newEntries:",
      newEntries
    );
  }
  return await getFavs(key);
}

/**
 * @param {string} key
 * @param {FavEntry} e
 * @returns {Promise<FavEntry[]>}
 */
export async function addToFavs(key, e) {
  // remove if exist, we don't want duplicates
  let entries = await removeFav(key, e);
  entries.push(e);
  await setFavs(key, entries);
  return entries;
}

const favKeyName = "favorites";
/**
 * @returns {Promise<FavEntry[]>}
 */
export async function getFavorites() {
  return await getFavs(favKeyName);
}

/**
 * @param {FavEntry[]} v
 */
export async function setFavorites(v) {
  await setFavs(favKeyName, v);
}

/**
 * @param {FavEntry} e
 * @returns {Promise<FavEntry[]>}
 */
export async function removeFavorite(e) {
  return await removeFav(favKeyName, e);
}

/**
 * @param {FavEntry} e
 * @returns {Promise<FavEntry[]>}
 */
export async function addToFavorites(e) {
  return await addToFavs(favKeyName, e);
}

const recentKeyName = "recent";
/**
 * @returns {Promise<FavEntry[]>}
 */
export async function getRecent() {
  return await getFavs(recentKeyName);
}

/**
 * @param {FavEntry[]} v
 */
export async function setRecent(v) {
  await setFavs(recentKeyName, v);
}

/**
 * @param {FavEntry} e
 * @returns {Promise<FavEntry[]>}
 */
export async function removeRecent(e) {
  return await removeFav(recentKeyName, e);
}

/**
 * @param {FavEntry} e
 * @returns {Promise<FavEntry[]>}
 */
export async function addToRecent(e) {
  return await addToFavs(recentKeyName, e);
}

export async function clearRecent() {
  await setRecent([]);
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
 * an array of FileSystemDirectoryHandle for remembering
 * opened folders in DialogBrowse
 */
function browseFoldersStore() {
  console.log("browseFolderStore");
  const dbKey = "browse-folders";
  let curr = [];
  let subscribers = [];

  db.get(dbKey).then((v) => {
    curr = v || [];
    broadcastValue();
  });

  function broadcastValue() {
    console.log("broadcastValue:", curr);
    for (const sub of subscribers) {
      sub(curr);
    }
  }

  /**
   * @param {FileSystemDirectoryHandle[]} v
   */
  function set(v) {
    console.log("set:", v);
    curr = v;
    broadcastValue();
    db.set(dbKey, v);
  }

  /**
   * @param {Function} subscription
   */
  function subscribe(subscription) {
    console.log("subscribe:, curr:", curr);
    subscription(curr);
    const idx = len(subscribers);
    subscribers.push(subscription);
    function unsubscribe() {
      subscribers.splice(idx, 1);
    }
    return unsubscribe;
  }

  return { set, subscribe };
}

export let browseFolders = browseFoldersStore();
