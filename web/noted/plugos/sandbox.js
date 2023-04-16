export class Sandbox {
  constructor(plug, worker) {
    this.reqId = 0;
    this.outstandingInits = /* @__PURE__ */ new Map();
    this.outstandingDependencyInits = /* @__PURE__ */ new Map();
    this.outstandingInvocations = /* @__PURE__ */ new Map();
    this.loadedFunctions = /* @__PURE__ */ new Set();
    this.logBuffer = [];
    this.maxLogBufferSize = 100;
    worker.onMessage = this.onMessage.bind(this);
    this.worker = worker;
    this.plug = plug;
  }
  isLoaded(name) {
    return this.loadedFunctions.has(name);
  }
  async load(name, code) {
    await this.worker.ready;
    const outstandingInit = this.outstandingInits.get(name);
    if (outstandingInit) {
      return new Promise((resolve) => {
        this.outstandingInits.set(name, () => {
          outstandingInit();
          resolve();
        });
      });
    }
    this.worker.postMessage({
      type: "load",
      name,
      code
    });
    return new Promise((resolve) => {
      this.outstandingInits.set(name, () => {
        this.loadedFunctions.add(name);
        this.outstandingInits.delete(name);
        resolve();
      });
    });
  }
  loadDependency(name, code) {
    this.worker.postMessage({
      type: "load-dependency",
      name,
      code
    });
    return new Promise((resolve) => {
      this.outstandingDependencyInits.set(name, () => {
        this.outstandingDependencyInits.delete(name);
        resolve();
      });
    });
  }
  async onMessage(data) {
    switch (data.type) {
      case "inited": {
        const initCb = this.outstandingInits.get(data.name);
        initCb && initCb();
        this.outstandingInits.delete(data.name);
        break;
      }
      case "dependency-inited": {
        const depInitCb = this.outstandingDependencyInits.get(data.name);
        depInitCb && depInitCb();
        this.outstandingDependencyInits.delete(data.name);
        break;
      }
      case "syscall":
        try {
          const result = await this.plug.syscall(data.name, data.args);
          this.worker.postMessage({
            type: "syscall-response",
            id: data.id,
            result
          });
        } catch (e) {
          this.worker.postMessage({
            type: "syscall-response",
            id: data.id,
            error: e.message
          });
        }
        break;
      case "result": {
        const resultCbs = this.outstandingInvocations.get(data.id);
        this.outstandingInvocations.delete(data.id);
        if (data.error) {
          resultCbs && resultCbs.reject(
            new Error(`${data.error}
Stack trace: ${data.stack}`)
          );
        } else {
          resultCbs && resultCbs.resolve(data.result);
        }
        break;
      }
      case "log": {
        this.log(data.level, data.message);
        break;
      }
      default:
        console.error("Unknown message type", data);
    }
  }
  log(level, ...messageBits) {
    const message = messageBits.map((a) => "" + a).join(" ");
    this.logBuffer.push({
      message,
      level,
      date: Date.now()
    });
    if (this.logBuffer.length > this.maxLogBufferSize) {
      this.logBuffer.shift();
    }
    console.log(`[Sandbox ${level}]`, message);
  }
  invoke(name, args) {
    this.reqId++;
    this.worker.postMessage({
      type: "invoke",
      id: this.reqId,
      name,
      args
    });
    return new Promise((resolve, reject) => {
      this.outstandingInvocations.set(this.reqId, { resolve, reject });
    });
  }
  stop() {
    this.worker.terminate();
  }
}
