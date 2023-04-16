import { clientStore, editor, system } from "$sb/silverbullet-syscall/mod.js";

import { readSettings } from "$sb/lib/settings_page.js";
export async function togglePreview() {
  const currentValue = !!(await clientStore.get("enableMarkdownPreview"));
  await clientStore.set("enableMarkdownPreview", !currentValue);
  if (!currentValue) {
    await system.invokeFunction("client", "preview");
  } else {
    await hideMarkdownPreview();
  }
}
async function hideMarkdownPreview() {
  const setting = await readSettings({ previewOnRHS: true });
  await editor.hidePanel(setting.previewOnRHS ? "rhs" : "lhs");
}
