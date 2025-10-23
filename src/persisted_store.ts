import { writable as internal } from "svelte/store";

// based on https://github.com/futurGH/ts-to-jsdoc

type Updater<T> = (value: T) => T;

type StoreDict<T> = { [key: string]: import("svelte/store").Writable<T> };

type StorageType = 'local' | 'session';

type Stores = {
  local: StoreDict<any>;
  session: StoreDict<any>;
};

type Serializer = Object;

type Options = {
  storage?: StorageType;
};

const stores: Stores = {
  local: {},
  session: {},
};

function getStorage(type: StorageType): any {
  return type === "local" ? localStorage : sessionStorage;
}

export function persisted<T>(key: string, initialValue: T, options?: Options): import("svelte/store").Writable<T> {
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
