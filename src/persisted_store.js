import { writable as internal } from "svelte/store";

// based on https://github.com/futurGH/ts-to-jsdoc

/** @typedef  */
const stores = {
  local: {},
  session: {},
};

/**
 * @typedef {(value: T) => T} Updater
 * @template T
 */

/**
 * @typedef {{ [key: string]: import("svelte/store").Writable<T> }} StoreDict
 * @template T
 */

/** @typedef {'local' | 'session'} StorageType */

/**
 * @typedef {Object} Stores
 * @property {StoreDict<any>} local
 * @property {StoreDict<any>} session
 */

/** @typedef {Object} Serializer */

/**
 * @typedef {Object} Options
 * @property {StorageType} [storage]
 */

/**
 * @param {StorageType} type
 * @returns {any}
 */
function getStorage(type) {
  return type === "local" ? localStorage : sessionStorage;
}

/**
 * @typedef {import("svelte/store").Writable<T>} Writable<T>
 * @template T
 */

/**
 * @param {string} key
 * @template T
 * @param {T} initialValue
 * @param {Options} [options]
 * @returns {Writable<T>}
 */
export function persisted(key, initialValue, options) {
  const storageType = options?.storage ?? "local";
  const isBrowser =
    typeof window !== "undefined" && typeof document !== "undefined";
  const storage = isBrowser ? getStorage(storageType) : null;

  function updateStorage(key, value) {
    storage?.setItem(key, JSON.stringify(value));
  }

  if (!stores[storageType][key]) {
    const store = internal(initialValue, (set) => {
      const json = storage?.getItem(key);

      if (json) {
        set(JSON.parse(json));
      }

      if (isBrowser && storageType == "local") {
        const handleStorage = (event) => {
          if (event.key === key)
            set(event.newValue ? JSON.parse(event.newValue) : null);
        };

        window.addEventListener("storage", handleStorage);

        return () => window.removeEventListener("storage", handleStorage);
      }
    });

    const { subscribe, set } = store;

    stores[storageType][key] = {
      set(value) {
        updateStorage(key, value);
        set(value);
      },
      update(callback) {
        return store.update((last) => {
          const value = callback(last);

          updateStorage(key, value);

          return value;
        });
      },
      subscribe,
    };
  }

  return stores[storageType][key];
}
