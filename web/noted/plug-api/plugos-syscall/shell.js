import { syscall } from "./syscall.ts";
export function run(cmd, args) {
  return syscall("shell.run", cmd, args);
}
