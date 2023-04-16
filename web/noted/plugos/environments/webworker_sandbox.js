import { safeRun } from "../util.ts";
import { Sandbox } from "../sandbox.ts";
class WebWorkerWrapper {
  constructor(worker) {
    this.worker = worker;
    this.worker.addEventListener("message", (evt) => {
      let data = evt.data;
      if (!data)
        return;
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
export function createSandbox(plug) {
  const worker = new Worker(
    import.meta.url ? new URL("sandbox_worker.ts", import.meta.url) : new URL("worker.js", location.origin),
    {
      type: "module"
    }
  );
  return new Sandbox(plug, new WebWorkerWrapper(worker));
}
