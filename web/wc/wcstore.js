// https://www.npmjs.com/package/idb

import { KV, makeIndexedDBStore } from "../dbutil";

const db = new KV("wcstore", "keyval");

/**
 * @typedef {Object} RecentEntry
 * @property {string} name
 * @property {FileSystemDirectoryHandle} dirHandle
 */

/** @type {import("svelte/store").Writable<RecentEntry[]>} */
export let recent = makeIndexedDBStore(db, "recent", [], false);
