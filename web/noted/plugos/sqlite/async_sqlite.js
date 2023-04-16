import { AssetBundle } from "../asset_bundle/bundle.js";
import workerBundleJson from "./worker_bundle.json" assert { type: "json" };
const workerBundle = new AssetBundle(workerBundleJson);
export class AsyncSQLite {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.requestId = 0;
    this.outstandingRequests = /* @__PURE__ */ new Map();
    const workerHref = URL.createObjectURL(
      new Blob([workerBundle.readFileSync("worker.js")], {
        type: "application/javascript",
      })
    );
    this.worker = new Worker(workerHref, {
      type: "module",
    });
    this.worker.addEventListener("message", (event) => {
      const { data } = event;
      const { id, result, error } = data;
      const req = this.outstandingRequests.get(id);
      if (!req) {
        console.error("Invalid request id", id);
        return;
      }
      if (result !== void 0) {
        req.resolve(result);
      } else if (error) {
        req.reject(new Error(error));
      }
      this.outstandingRequests.delete(id);
    });
  }
  request(message) {
    this.requestId++;
    return new Promise((resolve, reject) => {
      this.outstandingRequests.set(this.requestId, { resolve, reject });
      this.worker.postMessage({ ...message, id: this.requestId });
    });
  }
  init() {
    return this.request({ type: "init", dbPath: this.dbPath });
  }
  execute(query, ...params) {
    return this.request({ type: "execute", query, params });
  }
  query(query, ...params) {
    return this.request({ type: "query", query, params });
  }
  stop() {
    this.worker.terminate();
  }
}
