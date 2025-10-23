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

let db: import("idb").IDBPDatabase;

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
  name: string; // name of the file in the archive
  dbKey: string; // key in files stores
  type: string; // type of the file e.g. "image/jpeg", "image/png" etc.
  size: number; // size of the file in bytes
  resX: number; // horizontal resolution in pixels
  resY: number; // vertical resolution in pixels
}

export class ComicBookMeta {
  archiveFileName: string;
  files: ComicBookFile[];
  // TODO: remember when added?
}

export async function getMeta(): Promise<ComicBookMeta[]> {
  let db = await getDB();
  let res = await db.getAll(storeNameMeta);
  return res;
}
