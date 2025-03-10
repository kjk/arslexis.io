// https://www.npmjs.com/package/idb

import { KV, makeIndexedDBStore } from "../dbutil";

const db = new KV("fmstore", "keyval");

/**
 @typedef {{
    name: string,
    dirHandle: FileSystemDirectoryHandle
  }} RecentEntry
*/

/** @type {import("svelte/store").Writable<RecentEntry[]>} */
export let recent = makeIndexedDBStore(db, "recent", [], false);
