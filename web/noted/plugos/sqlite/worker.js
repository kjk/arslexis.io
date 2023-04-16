import { DB } from "./deno-sqlite/mod.ts";
let db;
import { compile } from "./deno-sqlite/build/sqlite.js";
const ready = compile();
globalThis.addEventListener("message", (event) => {
  const { data } = event;
  ready.then(() => {
    switch (data.type) {
      case "init": {
        try {
          db = new DB(data.dbPath);
        } catch (e) {
          respondError(data.id, e);
          break;
        }
        respond(data.id, true);
        break;
      }
      case "execute": {
        if (!db) {
          respondError(data.id, new Error("Not initialized"));
          break;
        }
        try {
          db.query(data.query, data.params);
          respond(data.id, db.changes);
        } catch (e) {
          respondError(data.id, e);
        }
        break;
      }
      case "query": {
        if (!db) {
          respondError(data.id, new Error("Not initialized"));
          break;
        }
        try {
          const result = db.queryEntries(data.query, data.params);
          respond(data.id, result);
        } catch (e) {
          respondError(data.id, e);
        }
        break;
      }
    }
  }).catch(console.error);
});
function respond(id, result) {
  globalThis.postMessage({ id, result });
}
function respondError(id, error) {
  globalThis.postMessage({ id, error: error.message });
}
