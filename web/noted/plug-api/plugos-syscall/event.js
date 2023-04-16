import { syscall } from "./syscall.js";
export function dispatchEvent(eventName, data, timeout) {
  return new Promise((resolve, reject) => {
    let timeouter = -1;
    if (timeout) {
      timeouter = setTimeout(() => {
        console.log("Timeout!");
        reject("timeout");
      }, timeout);
    }
    syscall("event.dispatch", eventName, data)
      .then((r) => {
        if (timeouter !== -1) {
          clearTimeout(timeouter);
        }
        resolve(r);
      })
      .catch(reject);
  });
}
export function listEvents() {
  return syscall("event.list");
}
