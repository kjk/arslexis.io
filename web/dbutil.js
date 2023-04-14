import { get } from "svelte/store";
import { len } from "./util";
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
  // rejects if already exists
  async add(key, val) {
    return (await this.dbPromise).add(this.storeName, val, key);
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

/**
 * Create a generic Svelte store persisted in IndexedDB
 * @param {string} dbKey unique IndexedDB key for storing this value
 * @param {any} initialValue
 * @param {boolean} crossTab if true, changes are visible in other browser tabs (windows)
 * @returns {any}
 */
export function makeIndexedDBStore(
  db,
  dbKey,
  initialValue,
  crossTab,
  log = false
) {
  function makeStoreMaker(dbKey, initialValue, crossTab) {
    const lsKey = "store-notify:" + dbKey;
    let curr = initialValue;
    const subscribers = new Set();

    function getCurrentValue() {
      db.get(dbKey).then((v) => {
        console.log(`getCurrentValue: key: '${dbKey}'`);
        console.log("v:", v);
        curr = v || [];
        subscribers.forEach((cb) => cb(curr));
      });
    }

    getCurrentValue();

    /**
     * @param {StorageEvent} event
     */
    function storageChanged(event) {
      if (event.storageArea === localStorage && event.key === lsKey) {
        getCurrentValue();
      }
    }
    if (crossTab) {
      window.addEventListener("storage", storageChanged, false);
    }

    function set(v) {
      if (log) {
        console.log(`db.set() key '${dbKey}', len(v): ${len(v)}`);
        console.log("v:", v);
      }
      curr = v;
      subscribers.forEach((cb) => cb(curr));
      db.set(dbKey, v).then((v) => {
        console.log("saved");
        if (crossTab) {
          const n = +localStorage.getItem(lsKey) || 0;
          localStorage.setItem(lsKey, `${n + 1}`);
        }
      });
    }

    /**
     * @param {Function} subscriber
     */
    function subscribe(subscriber) {
      subscriber(curr);
      subscribers.add(subscriber);
      function unsubscribe() {
        subscribers.delete(subscriber);
      }
      return unsubscribe;
    }

    return { set, subscribe };
  }
  return makeStoreMaker(dbKey, initialValue, crossTab);
}

/**
 * @param {import("svelte/store").Writable<any>} store
 */
export function resaveStore(store) {
  let v = get(store);
  console.log("resaveStore: Len(v)", len(v));
  store.set(v);
}
