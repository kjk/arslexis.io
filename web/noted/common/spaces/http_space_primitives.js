import {
  base64DecodeDataUrl,
  base64Encode,
  base64EncodedDataUrl
} from "../../plugos/asset_bundle/base64.ts";
import { mime } from "../../plugos/deps.ts";
export class HttpSpacePrimitives {
  constructor(url, user, password, base64Put) {
    this.user = user;
    this.password = password;
    this.base64Put = base64Put;
    this.fsUrl = url + "/fs";
    this.plugUrl = url + "/plug";
  }
  async authenticatedFetch(url, options) {
    if (this.user && this.password) {
      if (!options.headers) {
        options.headers = {};
      }
      options.headers["cookie"] = `auth=${btoa(`${this.user}:${this.password}`)}`;
    }
    const result = await fetch(url, options);
    if (result.status === 401 || result.redirected) {
      if (typeof location !== "undefined") {
        location.reload();
      }
      throw Error("Unauthorized");
    }
    return result;
  }
  async fetchFileList() {
    const req = await this.authenticatedFetch(this.fsUrl, {
      method: "GET"
    });
    return req.json();
  }
  async readFile(name, encoding) {
    const res = await this.authenticatedFetch(
      `${this.fsUrl}/${encodeURI(name)}`,
      {
        method: "GET"
      }
    );
    if (res.status === 404) {
      throw new Error(`Page not found`);
    }
    let data = null;
    switch (encoding) {
      case "arraybuffer":
        {
          data = await res.arrayBuffer();
        }
        break;
      case "dataurl":
        {
          data = base64EncodedDataUrl(
            mime.getType(name) || "application/octet-stream",
            new Uint8Array(await res.arrayBuffer())
          );
        }
        break;
      case "utf8":
        data = await res.text();
        break;
    }
    return {
      data,
      meta: this.responseToMeta(name, res)
    };
  }
  async writeFile(name, encoding, data) {
    let body = null;
    switch (encoding) {
      case "arraybuffer":
        body = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
        break;
      case "utf8":
        body = data;
        break;
      case "dataurl":
        data = base64DecodeDataUrl(data);
        break;
    }
    const headers = {
      "Content-Type": "application/octet-stream"
    };
    if (this.base64Put) {
      headers["X-Content-Base64"] = "true";
      headers["Content-Type"] = "text/plain";
      body = base64Encode(body);
    }
    const res = await this.authenticatedFetch(
      `${this.fsUrl}/${encodeURI(name)}`,
      {
        method: "PUT",
        headers,
        body
      }
    );
    const newMeta = this.responseToMeta(name, res);
    return newMeta;
  }
  async deleteFile(name) {
    const req = await this.authenticatedFetch(
      `${this.fsUrl}/${encodeURI(name)}`,
      {
        method: "DELETE"
      }
    );
    if (req.status !== 200) {
      throw Error(`Failed to delete file: ${req.statusText}`);
    }
  }
  async getFileMeta(name) {
    const res = await this.authenticatedFetch(
      `${this.fsUrl}/${encodeURI(name)}`,
      {
        method: "OPTIONS"
      }
    );
    if (res.status === 404) {
      throw new Error(`File not found`);
    }
    return this.responseToMeta(name, res);
  }
  responseToMeta(name, res) {
    return {
      name,
      size: +res.headers.get("X-Content-Length"),
      contentType: res.headers.get("Content-type"),
      lastModified: +(res.headers.get("X-Last-Modified") || "0"),
      perm: res.headers.get("X-Permission") || "rw"
    };
  }
  async proxySyscall(plug, name, args) {
    const req = await this.authenticatedFetch(
      `${this.plugUrl}/${plug.name}/syscall/${name}`,
      {
        method: "POST",
        headers: {
          "Content-type": "application/json"
        },
        body: JSON.stringify(args)
      }
    );
    if (req.status !== 200) {
      const error = await req.text();
      throw Error(error);
    }
    if (req.headers.get("Content-length") === "0") {
      return;
    }
    return await req.json();
  }
  async invokeFunction(plug, env, name, args) {
    if (!env || env === "client") {
      return plug.invoke(name, args);
    }
    const req = await this.authenticatedFetch(
      `${this.plugUrl}/${plug.name}/function/${name}`,
      {
        method: "POST",
        headers: {
          "Content-type": "application/json"
        },
        body: JSON.stringify(args)
      }
    );
    if (req.status !== 200) {
      const error = await req.text();
      throw Error(error);
    }
    if (req.headers.get("Content-length") === "0") {
      return;
    }
    if (req.headers.get("Content-type")?.includes("application/json")) {
      return await req.json();
    } else {
      return await req.text();
    }
  }
}
