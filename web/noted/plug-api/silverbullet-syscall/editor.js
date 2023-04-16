import { syscall } from "./syscall.js";
export function getCurrentPage() {
  return syscall("editor.getCurrentPage");
}
export function setPage(newName) {
  return syscall("editor.setPage", newName);
}
export function getText() {
  return syscall("editor.getText");
}
export function getCursor() {
  return syscall("editor.getCursor");
}
export function getSelection() {
  return syscall("editor.getSelection");
}
export function setSelection(from, to) {
  return syscall("editor.setSelection", from, to);
}
export function save() {
  return syscall("editor.save");
}
export function navigate(name, pos, replaceState = false, newWindow = false) {
  return syscall("editor.navigate", name, pos, replaceState, newWindow);
}
export function reloadPage() {
  return syscall("editor.reloadPage");
}
export function openUrl(url) {
  return syscall("editor.openUrl", url);
}
export function downloadFile(filename, dataUrl) {
  return syscall("editor.downloadFile", filename, dataUrl);
}
export function flashNotification(message, type = "info") {
  return syscall("editor.flashNotification", message, type);
}
export function filterBox(label, options, helpText = "", placeHolder = "") {
  return syscall("editor.filterBox", label, options, helpText, placeHolder);
}
export function showPanel(id, mode, html, script = "") {
  return syscall("editor.showPanel", id, mode, html, script);
}
export function hidePanel(id) {
  return syscall("editor.hidePanel", id);
}
export function insertAtPos(text, pos) {
  return syscall("editor.insertAtPos", text, pos);
}
export function replaceRange(from, to, text) {
  return syscall("editor.replaceRange", from, to, text);
}
export function moveCursor(pos, center = false) {
  return syscall("editor.moveCursor", pos, center);
}
export function insertAtCursor(text) {
  return syscall("editor.insertAtCursor", text);
}
export function dispatch(change) {
  return syscall("editor.dispatch", change);
}
export function prompt(message, defaultValue = "") {
  return syscall("editor.prompt", message, defaultValue);
}
export function confirm(message) {
  return syscall("editor.confirm", message);
}
export function getUiOption(key) {
  return syscall("editor.getUiOption", key);
}
export function setUiOption(key, value) {
  return syscall("editor.setUiOption", key, value);
}
export function vimEx(exCommand) {
  return syscall("editor.vimEx", exCommand);
}
