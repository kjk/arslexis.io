import { safeRun } from "../util.js";
import { Sandbox } from "../sandbox.js";
import { AssetBundle } from "../asset_bundle/bundle.js";
class DenoWorkerWrapper {
  constructor(worker) {
    this.worker = worker;
    this.worker.addEventListener("message", (evt) => {
      const data = evt.data;
      if (!data) return;
      safeRun(async () => {
        await this.onMessage(data);
      });
    });
    this.ready = Promise.resolve();
  }
  postMessage(message) {
    this.worker.postMessage(message);
  }
  terminate() {
    return this.worker.terminate();
  }
}
import workerBundleJson from "./worker_bundle.json" assert { type: "json" };
const workerBundle = new AssetBundle(workerBundleJson);
export function createSandbox(plug) {
  const workerHref = URL.createObjectURL(
    new Blob([workerBundle.readFileSync("worker.js")], {
      type: "application/javascript",
    })
  );
  const worker = new Worker(workerHref, {
    type: "module",
    deno: {
      permissions: {
        net: false,
        env: true,
        ffi: false,
        run: false,
        read: false,
        write: false,
      },
    },
  });
  return new Sandbox(plug, new DenoWorkerWrapper(worker));
}
