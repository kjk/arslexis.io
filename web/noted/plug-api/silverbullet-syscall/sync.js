import { syscall } from "./syscall.js";
export function syncAll(endpoint, snapshot) {
  return syscall("sync.syncAll", endpoint, snapshot);
}
export function syncFile(endpoint, snapshot, name) {
  return syscall("sync.syncFile", endpoint, snapshot, name);
}
export function check(endpoint) {
  return syscall("sync.check", endpoint);
}
