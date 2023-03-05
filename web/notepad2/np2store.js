// https://www.npmjs.com/package/idb

import { KV } from "../dbutil";
import { len, throwIf } from "../util";
import { fsTypeComputer, fsTypeLocalStorage } from "./FsFile";

const db = new KV("np2store", "keyval");

/**
 * @typedef {Object} FavEntry
 * @property {string} fs
 * @property {string} name
 * @property {string} id
 * @property {FileSystemFileHandle} fileHandle
 * @property {string} favName
 */

// TODO: expose as svelte store

const favKeyName = "favorites";
/**
 * @returns {Promise<FavEntry[]>}
 */
export async function getFavorites() {
  return (await db.get(favKeyName)) || [];
}

/**
 * @param {FavEntry[]} v
 */
export async function setFavorites(v) {
  await db.set(favKeyName, v);
}

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
    case fsTypeLocalStorage:
      return e1.id === e2.id;
    case fsTypeComputer:
      const eq = await e1.fileHandle.isSameEntry(e2.fileHandle);
      return eq;
  }
  throwIf(true, `unknown e1.fs: '${e1.fs}`);
  return false;
}

/**
 * @param {FavEntry} e
 * @returns {Promise<FavEntry[]>}
 */
export async function removeFavorite(e) {
  let entries = await getFavorites();
  let newEntries = [];
  for (const ee of entries) {
    const eq = await favEq(ee, e);
    console.log("eq:", eq);
    if (!eq) newEntries.push(ee);
  }
  if (len(entries) === len(newEntries) + 1) {
    await setFavorites(newEntries);
  } else {
    console.log(
      "removeFavorites: didn't remove! entries:",
      entries,
      "newEntries:",
      newEntries
    );
  }
  return await getFavorites();
}
