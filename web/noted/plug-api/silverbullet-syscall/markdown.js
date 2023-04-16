import { syscall } from "$sb/silverbullet-syscall/syscall.js";
export function parseMarkdown(text) {
  return syscall("markdown.parseMarkdown", text);
}
