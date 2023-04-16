import { editor, space, sync, system } from "$sb/silverbullet-syscall/mod.js";

import { readSetting } from "$sb/lib/settings_page.js";
import { store } from "$sb/plugos-syscall/mod.js";
export async function configureCommand() {
  const url = await editor.prompt(
    "Enter the URL of the remote space to sync with",
    "https://"
  );
  if (!url) {
    return;
  }
  const user = await editor.prompt("Username (if any):");
  let password = void 0;
  if (user) {
    password = await editor.prompt("Password:");
  }
  const syncConfig = {
    url,
    user,
    password,
  };
  try {
    await system.invokeFunction("server", "check", syncConfig);
  } catch (e) {
    await editor.flashNotification(
      `Sync configuration failed: ${e.message}`,
      "error"
    );
    return;
  }
  await store.batchSet([
    { key: "sync.config", value: syncConfig },
    { key: "sync.snapshot", value: {} },
  ]);
  await editor.flashNotification("Sync configuration saved.");
  return syncConfig;
}
export async function syncCommand() {
  let config = await store.get("sync.config");
  if (!config) {
    config = await configureCommand();
    if (!config) {
      return;
    }
  }
  await editor.flashNotification("Starting sync...");
  try {
    await system.invokeFunction("server", "check", config);
    const operations = await system.invokeFunction("server", "performSync");
    await editor.flashNotification(
      `Sync complete. Performed ${operations} operations.`
    );
  } catch (e) {
    await editor.flashNotification(`Sync failed: ${e.message}`, "error");
  }
}
export async function disableCommand() {
  if (!(await editor.confirm("Are you sure you want to disable sync?"))) {
    return;
  }
  await store.deletePrefix("sync.");
  await editor.flashNotification("Sync disabled.");
}
export async function localWipeAndSyncCommand() {
  let config = await store.get("sync.config");
  if (!config) {
    config = await configureCommand();
    if (!config) {
      return;
    }
  }
  if (
    !(await editor.confirm(
      "Are you sure you want to wipe your local space and sync with the remote?"
    ))
  ) {
    return;
  }
  if (
    !(await editor.confirm(
      "To be clear: this means all local content will be deleted with no way to recover it. Are you sure?"
    ))
  ) {
    return;
  }
  console.log("Wiping local pages");
  await editor.flashNotification("Now wiping all pages");
  for (const page of await space.listPages()) {
    console.log("Deleting page", page.name);
    await space.deletePage(page.name);
  }
  console.log("Wiping local attachments");
  await editor.flashNotification("Now wiping all attachments");
  for (const attachment of await space.listAttachments()) {
    console.log("Deleting attachment", attachment.name);
    await space.deleteAttachment(attachment.name);
  }
  console.log("Wiping local sync state");
  await store.set("sync.snapshot", {});
  await syncCommand();
  await system.invokeFunction("client", "core.updatePlugsCommand");
}
export async function syncOpenedPage() {
  if (!(await store.has("sync.config"))) {
    return;
  }
  await system.invokeFunction(
    "server",
    "syncPage",
    await editor.getCurrentPage()
  );
}
export function check(config) {
  return sync.check(config);
}
const syncTimeout = 1e3 * 60 * 10;
export async function performSync() {
  const config = await store.get("sync.config");
  if (!config) {
    return;
  }
  await augmentSettings(config);
  const ongoingSync = await store.get("sync.startTime");
  if (ongoingSync) {
    if (Date.now() - ongoingSync > syncTimeout) {
      console.log("Sync timed out, continuing");
    } else {
      console.log("Sync already in progress");
      return;
    }
  }
  await store.set("sync.startTime", Date.now());
  try {
    const snapshot = await store.get("sync.snapshot");
    const {
      snapshot: newSnapshot,
      operations,
      error,
    } = await sync.syncAll(config, snapshot);
    await store.set("sync.snapshot", newSnapshot);
    await store.del("sync.startTime");
    if (error) {
      console.error("Sync error", error);
      throw new Error(error);
    }
    return operations;
  } catch (e) {
    await store.del("sync.startTime");
    console.error("Sync error", e);
  }
}
async function augmentSettings(endpoint) {
  const syncSettings = await readSetting("sync", {});
  if (syncSettings.excludePrefixes) {
    endpoint.excludePrefixes = syncSettings.excludePrefixes;
  }
}
export async function syncPage(page) {
  const config = await store.get("sync.config");
  if (!config) {
    return;
  }
  await augmentSettings(config);
  const ongoingSync = await store.get("sync.startTime");
  if (ongoingSync) {
    if (Date.now() - ongoingSync > syncTimeout) {
      console.log("Sync timed out, continuing");
    } else {
      console.log("Sync already in progress");
      return;
    }
  }
  await store.set("sync.startTime", Date.now());
  const snapshot = await store.get("sync.snapshot");
  console.log("Syncing page", page);
  try {
    const { snapshot: newSnapshot, error } = await sync.syncFile(
      config,
      snapshot,
      `${page}.md`
    );
    await store.set("sync.snapshot", newSnapshot);
    await store.del("sync.startTime");
    if (error) {
      console.error("Sync error", error);
      throw new Error(error);
    }
  } catch (e) {
    await store.del("sync.startTime");
    console.error("Sync error", e);
  }
}
