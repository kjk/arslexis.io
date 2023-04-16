import { syscall } from "./syscall.ts";
export function set(key, value) {
  return syscall("clientStore.set", key, value);
}
export function get(key) {
  return syscall("clientStore.get", key);
}
export function del(key) {
  return syscall("clientStore.delete", key);
}
