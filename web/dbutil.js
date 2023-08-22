import { get } from "svelte/store";
import { len } from "./util";
import { openDB } from "idb";

export class KV {
  /** @type {string} */
  dbName;
  /** @type {string} */
  storeName;
  dbPromise;

  /**
    * @param {string} dbName
    * @param {string} storeName
  */
  constructor(dbName, storeName) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbPromise = openDB(dbName, 1, {
      upgrade(db) {
        db.createObjectStore(storeName);
      },
    });
  }

  /**
    * @param {string} key
  */
  async get(key) {
    return (await this.dbPromise).get(this.storeName, key);
  }
  /**
    * @param {string} key
    * @param {any} val
  */
  async set(key, val) {
    let db = await this.dbPromise;
    return db.put(this.storeName, val, key);
  }
  /**
    * rejects if already exists
    * @param {string} key
    * @param {any} val
  */
  async add(key, val) {
    let db = await this.dbPromise;
    return db.add(this.storeName, val, key);
  }
  /**
    * @param {string} key
  */
  async del(key) {
    let db = await this.dbPromise;
    return db.delete(this.storeName, key);
  }
  async clear() {
    let db = await this.dbPromise;
    return db.clear(this.storeName);
  }
  /**
    * @returns {Promise<IDBValidKey[]>}
  */
  async keys() {
    let db = await this.dbPromise;
    return db.getAllKeys(this.storeName);
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
  /**
    * @param {string} dbKey
    * @param {any} initialValue
    * @param {boolean} crossTab
  */
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

    /**
     * @param {any} v
     */
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
