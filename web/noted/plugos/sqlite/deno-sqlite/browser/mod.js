import { compile, instantiateBrowser } from "../build/sqlite.js";
import { loadFile, writeFile } from "./vfs.js";

import { DB } from "../src/db.js";
export { SqliteError } from "../src/error.js";
export { Status } from "../src/constants.js";
const hasCompiled = compile();
export async function open(file) {
  if (file != null && file !== ":memory:") await loadFile(file);
  await hasCompiled;
  await instantiateBrowser();
  return new DB(file);
}
export async function write(file, data) {
  await writeFile(file, data);
}
export async function read(file) {
  const buffer = await loadFile(file);
  return buffer?.toUint8Array()?.slice();
}
