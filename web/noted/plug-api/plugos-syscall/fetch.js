import { base64Decode } from "../../plugos/asset_bundle/base64.js";
export function sandboxFetch(url, options) {
  return syscall("sandboxFetch.fetch", url, options);
}
export function monkeyPatchFetch() {
  globalThis.fetch = async function (url, init) {
    const r = await sandboxFetch(
      url,
      init && {
        method: init.method,
        headers: init.headers,
        body: init.body,
      }
    );
    return new Response(r.base64Body ? base64Decode(r.base64Body) : null, {
      status: r.status,
      headers: r.headers,
    });
  };
}
