/*
Database for storing extracted files and their metadata.
Store "meta" contains metadata for each comic book. One object per comic book..
Store "files" contains the extracted files.
Metadata stores keys for file objects.
*/
import { openDB } from "idb";

const dbName = "comic-book-reader"
const storeNameMeta = "meta";
const storeNameFiles = "files";

/** @type {import("idb").IDBPDatabase} */
let db;

async function getDB() {
  if (!db) {
    db = await openDB(dbName, 1, {
      upgrade(db) {
        db.createObjectStore(storeNameMeta);
        db.createObjectStore(storeNameFiles);
      },
    });
  }
  return db;
}

export class ComicBookFile {
  /** @type {string} */
  name; // name of the file in the archive
  /** @type {string}  */
  dbKey; // key in files stores
  /** @type {string} */
  type; // type of the file e.g. "image/jpeg", "image/png" etc.
  /** @type {number} */
  size; // size of the file in bytes
  /** @type {number} */
  resX; // horizontal resolution in pixels
  /** @type {number} */
  resY; // vertical resolution in pixels
}

export class ComicBookMeta {
  /** @type {string} */
  archiveFileName;
  /** @type {ComicBookFile[]} */
  files;
  // TODO: remember when added?
}

/**
  * Potentially expensive but I dont see a way around it.
  * @returns {Promise<ComicBookMeta[]>}
*/
export async function getMeta() {
  let db = await getDB();
  let res = await db.getAll(storeNameMeta);
  return res;
}
