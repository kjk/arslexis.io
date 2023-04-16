import { syscall } from "./syscall.js";
export function set(key, value) {
  return syscall("store.set", key, value);
}
export function batchSet(kvs) {
  return syscall("store.batchSet", kvs);
}
export function get(key) {
  return syscall("store.get", key);
}
export function has(key) {
  return syscall("store.has", key);
}
export function del(key) {
  return syscall("store.delete", key);
}
export function batchDel(keys) {
  return syscall("store.batchDelete", keys);
}
export function queryPrefix(prefix) {
  return syscall("store.queryPrefix", prefix);
}
export function deletePrefix(prefix) {
  return syscall("store.deletePrefix", prefix);
}
export function deleteAll() {
  return syscall("store.deleteAll");
}
