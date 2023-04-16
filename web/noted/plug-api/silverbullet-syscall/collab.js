import { syscall } from "./syscall.js";
export function start(serverUrl, token, username) {
  return syscall("collab.start", serverUrl, token, username);
}
export function stop() {
  return syscall("collab.stop");
}
