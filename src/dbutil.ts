import { get } from "svelte/store";
import { len } from "./util";
import { openDB } from "idb";

export class KV {
  dbName: string;
  storeName: string;
  dbPromise;

  constructor(dbName: string, storeName: string) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbPromise = openDB(dbName, 1, {
      upgrade(db) {
        db.createObjectStore(storeName);
      },
    });
  }

  async get(key: string) {
    return (await this.dbPromise).get(this.storeName, key);
  }
  async set(key: string, val: any) {
    let db = await this.dbPromise;
    return db.put(this.storeName, val, key);
  }
  async add(key: string, val: any) {
    let db = await this.dbPromise;
    return db.add(this.storeName, val, key);
  }
  async del(key: string) {
    let db = await this.dbPromise;
    return db.delete(this.storeName, key);
  }
  async clear() {
    let db = await this.dbPromise;
    return db.clear(this.storeName);
  }
  async keys(): Promise<IDBValidKey[]> {
    let db = await this.dbPromise;
    return db.getAllKeys(this.storeName);
  }
}

export function makeIndexedDBStore(
  db: KV,
  dbKey: string,
  initialValue: any,
  crossTab: boolean,
  log: boolean = false
): any {
  function makeStoreMaker(dbKey: string, initialValue: any, crossTab: boolean) {
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

    function storageChanged(event: StorageEvent) {
      if (event.storageArea === localStorage && event.key === lsKey) {
        getCurrentValue();
      }
    }
    if (crossTab) {
      window.addEventListener("storage", storageChanged, false);
    }

    function set(v: any) {
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

    function subscribe(subscriber: Function) {
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

export function resaveStore(store: import("svelte/store").Writable<any>) {
  let v = get(store);
  console.log("resaveStore: Len(v)", len(v));
  store.set(v);
}
