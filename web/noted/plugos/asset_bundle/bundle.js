import { base64Decode, base64EncodedDataUrl } from "./base64.js";

import { mime } from "../deps.js";

export class AssetBundle {
  constructor(bundle = {}) {
    this.bundle = bundle;
  }
  has(path) {
    return path in this.bundle;
  }
  listFiles() {
    return Object.keys(this.bundle);
  }
  readFileSync(path) {
    const content = this.bundle[path];
    if (!content) {
      throw new Error(`No such file ${path}`);
    }
    const data = content.split(",", 2)[1];
    return base64Decode(data);
  }
  readFileAsDataUrl(path) {
    const content = this.bundle[path];
    if (!content) {
      throw new Error(`No such file ${path}`);
    }
    return content;
  }
  readTextFileSync(path) {
    return new TextDecoder().decode(this.readFileSync(path));
  }
  getMimeType(path) {
    const content = this.bundle[path];
    if (!content) {
      throw new Error(`No such file ${path}`);
    }
    return content.split(";")[0].split(":")[1];
  }
  writeFileSync(path, data) {
    path = path.replaceAll("\\", "/");
    const mimeType = mime.getType(path) || "application/octet-stream";
    this.bundle[path] = base64EncodedDataUrl(mimeType, data);
  }
  writeTextFileSync(path, s) {
    this.writeFileSync(path, new TextEncoder().encode(s));
  }
  toJSON() {
    return this.bundle;
  }
}
