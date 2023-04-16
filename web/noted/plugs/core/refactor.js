import { editor, space } from "$sb/silverbullet-syscall/mod.js";
export async function extractToPage() {
  const newName = await editor.prompt(`New page title:`, "new page");
  if (!newName) {
    return;
  }
  console.log("New name", newName);
  try {
    await space.getPageMeta(newName);
    throw new Error(
      `Page ${newName} already exists, cannot rename to existing page.`
    );
  } catch (e) {
    if (e.message.includes("not found")) {
    } else {
      await editor.flashNotification(e.message, "error");
      throw e;
    }
  }
  let text = await editor.getText();
  const selection = await editor.getSelection();
  text = text.slice(selection.from, selection.to);
  await editor.replaceRange(selection.from, selection.to, `[[${newName}]]`);
  console.log("Writing new page to space");
  await space.writePage(newName, text);
  console.log("Navigating to new page");
  await editor.navigate(newName);
}
