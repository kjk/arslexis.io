import { editor } from "$sb/silverbullet-syscall/mod.js";
export async function replaceAsync(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
    return "";
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}
export function isServer() {
  return (
    typeof window === "undefined" || typeof window.document === "undefined"
  );
}
export function isBrowser() {
  return !isServer();
}
export function notifyUser(message, type) {
  if (isBrowser()) {
    return editor.flashNotification(message, type);
  }
  const log = type === "error" ? console.error : console.log;
  log(message);
  return;
}
