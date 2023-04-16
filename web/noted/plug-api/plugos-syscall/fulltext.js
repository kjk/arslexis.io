import { syscall } from "./syscall.js";
export function fullTextIndex(key, value) {
  return syscall("fulltext.index", key, value);
}
export function fullTextDelete(key) {
  return syscall("fulltext.delete", key);
}
export function fullTextSearch(phrase, options = {}) {
  return syscall("fulltext.search", phrase, options);
}
