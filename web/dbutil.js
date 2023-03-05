import { openDB } from "idb";

export class KV {
  dbName;
  storeName;
  dbPromise;

  constructor(dbName, storeName) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbPromise = openDB(dbName, 1, {
      upgrade(db) {
        db.createObjectStore(storeName);
      },
    });
  }

  async get(key) {
    return (await this.dbPromise).get(this.storeName, key);
  }
  async set(key, val) {
    return (await this.dbPromise).put(this.storeName, val, key);
  }
  async del(key) {
    return (await this.dbPromise).delete(this.storeName, key);
  }
  async clear() {
    return (await this.dbPromise).clear(this.storeName);
  }
  async keys() {
    return (await this.dbPromise).getAllKeys(this.storeName);
  }
}
