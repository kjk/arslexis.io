import { readYamlPage } from "./yaml_page.ts";
import { notifyUser } from "./util.ts";
import * as YAML from "yaml";
import { space } from "$sb/silverbullet-syscall/mod.ts";
const SETTINGS_PAGE = "SETTINGS";
export async function readSettings(settings) {
  try {
    const allSettings = await readYamlPage(SETTINGS_PAGE, ["yaml"]) || {};
    const collectedSettings = {};
    for (const [key, defaultVal] of Object.entries(settings)) {
      if (key in allSettings) {
        collectedSettings[key] = allSettings[key];
      } else {
        collectedSettings[key] = defaultVal;
      }
    }
    return collectedSettings;
  } catch (e) {
    if (e.message === "Page not found") {
      return settings;
    }
    throw e;
  }
}
export async function readSetting(key, defaultValue) {
  try {
    const allSettings = await readYamlPage(SETTINGS_PAGE, ["yaml"]) || {};
    const val = allSettings[key];
    return val === void 0 ? defaultValue : val;
  } catch (e) {
    if (e.message === "Page not found") {
      return defaultValue;
    }
    throw e;
  }
}
export async function writeSettings(settings) {
  let readSettings2 = {};
  try {
    readSettings2 = await readYamlPage(SETTINGS_PAGE, ["yaml"]) || {};
  } catch {
    await notifyUser("Creating a new SETTINGS page...", "info");
  }
  const writeSettings2 = { ...readSettings2, ...settings };
  const contents = `This page contains settings for configuring SilverBullet and its Plugs.
Any changes outside of the yaml block will be overwritten.
\`\`\`yaml
${YAML.stringify(
    writeSettings2
  )}
\`\`\``;
  await space.writePage(SETTINGS_PAGE, contents);
}
