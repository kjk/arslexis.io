export function getServerLogs() {
  return syscall("sandbox.getServerLogs");
}
