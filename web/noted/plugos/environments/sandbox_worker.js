import { ConsoleLogger } from "./custom_logger.js";
import { monkeyPatchFetch } from "../../plug-api/plugos-syscall/fetch.js";
import { safeRun } from "../util.js";
if (typeof Deno === "undefined") {
  self.Deno = {
    args: [],
    build: {
      arch: "x86_64",
    },
    env: {
      get() {},
    },
  };
}
const loadedFunctions = /* @__PURE__ */ new Map();
const pendingRequests = /* @__PURE__ */ new Map();
function workerPostMessage(msg) {
  if (typeof window !== "undefined" && window.parent !== window) {
    window.parent.postMessage(msg, "*");
  } else {
    self.postMessage(msg);
  }
}
let syscallReqId = 0;
self.syscall = async (name, ...args) => {
  return await new Promise((resolve, reject) => {
    syscallReqId++;
    pendingRequests.set(syscallReqId, { resolve, reject });
    workerPostMessage({
      type: "syscall",
      id: syscallReqId,
      name,
      args,
    });
  });
};
const loadedModules = /* @__PURE__ */ new Map();
self.require = (moduleName) => {
  const mod = loadedModules.get(moduleName);
  if (!mod) {
    throw new Error(
      `Dynamically importing non-preloaded library ${moduleName}`
    );
  }
  return mod;
};
self.console = new ConsoleLogger((level, message) => {
  workerPostMessage({ type: "log", level, message });
}, false);
function wrapScript(code) {
  return `return (${code})["default"]`;
}
self.addEventListener("message", (event) => {
  safeRun(async () => {
    const data = event.data;
    switch (data.type) {
      case "load":
        {
          const fn2 = new Function(wrapScript(data.code));
          loadedFunctions.set(data.name, fn2());
          workerPostMessage({
            type: "inited",
            name: data.name,
          });
        }
        break;
      case "load-dependency":
        {
          const fn3 = new Function(`return ${data.code}`);
          const v = fn3();
          loadedModules.set(data.name, v);
          workerPostMessage({
            type: "dependency-inited",
            name: data.name,
          });
        }
        break;
      case "invoke":
        {
          const fn = loadedFunctions.get(data.name);
          if (!fn) {
            throw new Error(`Function not loaded: ${data.name}`);
          }
          try {
            const result = await Promise.resolve(fn(...(data.args || [])));
            workerPostMessage({
              type: "result",
              id: data.id,
              result,
            });
          } catch (e) {
            workerPostMessage({
              type: "result",
              id: data.id,
              error: e.message,
              stack: e.stack,
            });
          }
        }
        break;
      case "syscall-response":
        {
          const syscallId = data.id;
          const lookup = pendingRequests.get(syscallId);
          if (!lookup) {
            console.log(
              "Current outstanding requests",
              pendingRequests,
              "looking up",
              syscallId
            );
            throw Error("Invalid request id");
          }
          pendingRequests.delete(syscallId);
          if (data.error) {
            lookup.reject(new Error(data.error));
          } else {
            lookup.resolve(data.result);
          }
        }
        break;
    }
  });
});
monkeyPatchFetch();
