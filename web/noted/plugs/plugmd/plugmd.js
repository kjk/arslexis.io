import * as YAML from "yaml";

import { collectNodesOfType, findNodeOfType } from "$sb/lib/tree.js";
import {
  editor,
  markdown,
  space,
  system,
} from "$sb/silverbullet-syscall/mod.js";

import { syscall } from "$sb/plugos-syscall/mod.js";
export async function compileCommand() {
  const text = await editor.getText();
  try {
    const manifest = await compileDefinition(text);
    await space.writePage(
      `_plug/${manifest.name}`,
      JSON.stringify(manifest, null, 2)
    );
    console.log("Wrote this plug", manifest);
    await editor.hidePanel("bhs");
    system.reloadPlugs();
  } catch (e) {
    await editor.showPanel("bhs", 1, e.message);
  }
}
export async function checkCommand() {
  const text = await editor.getText();
  try {
    await compileDefinition(text);
    await editor.hidePanel("bhs");
    system.reloadPlugs();
  } catch (e) {
    await editor.showPanel("bhs", 1, e.message);
  }
}
async function compileDefinition(text) {
  const tree = await markdown.parseMarkdown(text);
  const codeNodes = collectNodesOfType(tree, "FencedCode");
  let manifest;
  let code;
  let language = "js";
  for (const codeNode of codeNodes) {
    const codeInfo = findNodeOfType(codeNode, "CodeInfo").children[0].text;
    const codeText = findNodeOfType(codeNode, "CodeText").children[0].text;
    if (codeInfo === "yaml") {
      manifest = YAML.parse(codeText);
      continue;
    }
    if (codeInfo === "typescript" || codeInfo === "ts") {
      language = "ts";
    }
    code = codeText;
  }
  if (!manifest) {
    throw new Error("No meta found");
  }
  if (!code) {
    throw new Error("No code found");
  }
  manifest.dependencies = manifest.dependencies || {};
  for (const [dep, depSpec] of Object.entries(manifest.dependencies)) {
    const compiled = await system.invokeFunction(
      "server",
      "compileModule",
      depSpec
    );
    manifest.dependencies[dep] = compiled;
  }
  manifest.functions = manifest.functions || {};
  for (const [name, func] of Object.entries(manifest.functions)) {
    const compiled = await system.invokeFunction(
      "server",
      "compileJS",
      `file.${language}`,
      code,
      name,
      Object.keys(manifest.dependencies)
    );
    func.code = compiled;
  }
  console.log("Doing the whole manifest thing");
  return manifest;
}
export function compileJS(filename, code, functionName, excludeModules) {
  return syscall(
    "esbuild.compile",
    filename,
    code,
    functionName,
    excludeModules
  );
}
export function compileModule(moduleName) {
  return syscall("esbuild.compileModule", moduleName);
}
export async function getPlugPlugMd(pageName) {
  const text = await space.readPage(pageName);
  console.log("Compiling", pageName);
  return compileDefinition(text);
}
