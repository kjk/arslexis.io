import { syscall } from "./syscall.js";
export function invokeFunction(env, name, ...args) {
  return syscall("system.invokeFunction", env, name, ...args);
}
export function invokeCommand(name) {
  return syscall("system.invokeCommand", name);
}
export function listCommands() {
  return syscall("system.listCommands");
}
export function reloadPlugs() {
  syscall("system.reloadPlugs");
}
export function getEnv() {
  return syscall("system.getEnv");
}
