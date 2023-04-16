import { editor, markdown, system } from "$sb/silverbullet-syscall/mod.js";

import { events } from "$sb/plugos-syscall/mod.js";
import { extractFrontmatter } from "$sb/lib/frontmatter.js";
export async function publishCommand() {
  await editor.save();
  const text = await editor.getText();
  const pageName = await editor.getCurrentPage();
  const tree = await markdown.parseMarkdown(text);
  const { $share } = extractFrontmatter(tree);
  if (!$share) {
    await editor.flashNotification("Saved.");
    return;
  }
  if (!Array.isArray($share)) {
    await editor.flashNotification(
      "$share front matter must be an array.",
      "error"
    );
    return;
  }
  await editor.flashNotification("Sharing...");
  try {
    await system.invokeFunction("server", "publish", pageName, $share);
    await editor.flashNotification("Done!");
  } catch (e) {
    await editor.flashNotification(e.message, "error");
  }
}
export async function publish(pageName, uris) {
  for (const uri of uris) {
    const publisher = uri.split(":")[0];
    const results = await events.dispatchEvent(`share:${publisher}`, {
      uri,
      name: pageName,
    });
    if (results.length === 0) {
      throw new Error(`Unsupported publisher: ${publisher} for URI: ${uri}`);
    }
  }
}
