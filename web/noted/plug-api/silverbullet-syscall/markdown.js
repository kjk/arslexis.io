import { syscall } from "$sb/silverbullet-syscall/syscall.ts";
export function parseMarkdown(text) {
  return syscall("markdown.parseMarkdown", text);
}
