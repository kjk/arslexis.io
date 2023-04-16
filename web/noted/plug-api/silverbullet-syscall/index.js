import { syscall } from "./syscall.js";
export function set(page, key, value) {
  return syscall("index.set", page, key, value);
}
export function batchSet(page, kvs) {
  return syscall("index.batchSet", page, kvs);
}
export function get(page, key) {
  return syscall("index.get", page, key);
}
export function del(page, key) {
  return syscall("index.delete", page, key);
}
export function queryPrefix(prefix) {
  return syscall("index.queryPrefix", prefix);
}
export function query(query2) {
  return syscall("index.query", query2);
}
export function clearPageIndexForPage(page) {
  return syscall("index.clearPageIndexForPage", page);
}
export function deletePrefixForPage(page, prefix) {
  return syscall("index.deletePrefixForPage", page, prefix);
}
export function clearPageIndex() {
  return syscall("index.clearPageIndex");
}
