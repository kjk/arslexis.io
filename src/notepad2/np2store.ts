// https://www.npmjs.com/package/idb

import { FsFile, fsTypeFolder, fsTypeIndexedDB, setIDB } from "./FsFile";
import { KV, makeIndexedDBStore } from "../dbutil";

import { throwIf } from "../util";

const db = new KV("np2store", "keyval");

// TODO: not great, needed to avoid circular dependencies
setIDB(db);

type FavEntry = {
  fs: string;
  name: string;
  id: string;
  fileHandle: FileSystemFileHandle;
  favName: string;
};

export function favEntryFromFsFile(file: FsFile, favName: string): FavEntry {
  const e: FavEntry = {
    fs: file.type,
    name: file.name,
    favName: favName,
    id: file.id,
    fileHandle: file.fileHandle,
  };
  return e;
}

export function fsFileFromFavEntry(fav: FavEntry): FsFile {
  const name = fav.name; // or fav.favName?
  const f = new FsFile(fav.fs, name, name);
  f.fileHandle = fav.fileHandle;
  f.id = fav.id;
  return f;
}

export async function favEq(e1: FavEntry, e2: FavEntry): Promise<boolean> {
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

export async function rememberFileForNewWindow(f: FsFile) {
  const e = favEntryFromFsFile(f, f.name);
  await db.set(keyFileForNewWindow, e);
}

export async function getAndClearFileForNewWindow(): Promise<FsFile> {
  const fav = await db.get(keyFileForNewWindow);
  const f = fsFileFromFavEntry(fav);
  await db.del(keyFileForNewWindow);
  return f;
}

/**
 * an array of FileSystemDirectoryHandle for remembering
 * opened folders in DialogBrowse
 */
export let browseFolders = makeIndexedDBStore(db, "browse-folders", [], true);

export let recent: import("svelte/store").Writable<FavEntry[]> = makeIndexedDBStore(db, "recent", [], true);

export let favorites: import("svelte/store").Writable<FavEntry[]> = makeIndexedDBStore(db, "favorites", [], true);
