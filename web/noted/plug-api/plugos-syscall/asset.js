import { base64DecodeDataUrl } from "../../plugos/asset_bundle/base64.js";
import { syscall } from "./syscall.js";
export async function readAsset(name, encoding = "utf8") {
  const dataUrl = await syscall("asset.readAsset", name);
  switch (encoding) {
    case "utf8":
      return new TextDecoder().decode(base64DecodeDataUrl(dataUrl));
    case "dataurl":
      return dataUrl;
  }
}
