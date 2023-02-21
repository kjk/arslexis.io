import { Base64 } from "js-base64";
import { len } from "./util";

const wsRx = /\s{2,}/g;
/**
 * @param {string} s
 * @returns {string}
 */
export function strCompressWS(s) {
  // TODO: also remove single space from the beginning?
  return s.replaceAll(wsRx, " ");
}

/**
 * @param {string} s
 * @returns {string}
 */
function b64pad(s) {
  let n = 4 - (len(s) % 4);
  switch (n) {
    case 1:
      return s + "=";
    case 2:
      return s + "==";
    case 3:
      return s + "===";
  }
  return s;
}

/**
 * @param {string} s
 * @returns {string}
 */
export function b64EncodeStandard(s) {
  let res = Base64.encode(s, false /* url safe */);
  return b64pad(res);
}

/**
 * @param {string} s
 * @returns {string}
 */
export function b64EncodeURLSafe(s) {
  let res = Base64.encode(s, true /* url safe */);
  return b64pad(res);
}

/**
 * @param {string} s
 * @returns {string}
 */
export function b64EncodeHtmlImage(s) {
  let res = b64EncodeStandard(s);
  res = `<img src="data:image/py;base64,${res}" />`;
  return res;
}

/**
 * @param {string} s
 * @returns {string}
 */
export function b64Decode(s) {
  let res = Base64.decode(s);
  return res;
}

const hexTable = new TextEncoder().encode("0123456789ABCDEF");
const space = " ".charCodeAt(0); // stupid auto-formatter
/**
 * @param {string} s
 * @returns {string}
 */
export function strToHex(s) {
  let bytes = new TextEncoder().encode(s);
  let n = len(bytes);
  let dst = new Uint8Array(n * 3);
  let i = 0;
  for (let b of bytes) {
    dst[i] = hexTable[b >> 4];
    dst[i + 1] = hexTable[b & 0x0f];
    dst[i + 2] = space;
    i += 3;
  }
  return new TextDecoder().decode(dst);
}

/**
 * @param {string} s
 * @returns {string}
 */
export function b64DecodeAsHex(s) {
  let res = b64Decode(s);
  return strToHex(res);
}

// TODO: notepad2 has a slightly different algo for urlEncode()
/**
 * @param {string} s
 * @returns {string}
 */
export function urlEncode(s) {
  let res = encodeURI(s);
  return res;
}

/**
 * @param {string} s
 * @returns {string}
 */
export function urlDecode(s) {
  let res = decodeURI(s);
  return res;
}
