// https://www.npmjs.com/package/idb

import { KV, makeIndexedDBStore } from "../dbutil";

const db = new KV("fmstore", "keyval");

type RecentEntry = {
  name: string;
  dirHandle: FileSystemDirectoryHandle;
};

export let recent: import("svelte/store").Writable<RecentEntry[]> = makeIndexedDBStore(db, "recent", [], false);
