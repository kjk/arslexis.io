// https://www.npmjs.com/package/idb

import { openDB } from "idb";

const storeName = "keyval";

const dbPromise = openDB("np2store", 1, {
  upgrade(db) {
    db.createObjectStore(storeName);
  },
});

export async function get(key) {
  return (await dbPromise).get(storeName, key);
}
export async function set(key, val) {
  return (await dbPromise).put(storeName, val, key);
}
export async function del(key) {
  return (await dbPromise).delete(storeName, key);
}
export async function clear() {
  return (await dbPromise).clear(storeName);
}
export async function keys() {
  return (await dbPromise).getAllKeys(storeName);
}

/**
 * @typedef {Object} FavEntry
 * @property {string} fs
 * @property {string} name
 * @property {string} id
 * @property {FileSystemFileHandle} fileHandle
 * @property {string} favName
 */

const favKeyName = "favorites";
/**
 * @returns {Promise<FavEntry[]>}
 */
export async function getFavorites() {
  return (await get(favKeyName)) || [];
}

/**
 * @param {FavEntry[]} v
 */
export async function setFavorites(v) {
  await set(favKeyName, v);
}
