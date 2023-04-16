import { syscall } from "./syscall.js";
export function run(cmd, args) {
  return syscall("shell.run", cmd, args);
}
