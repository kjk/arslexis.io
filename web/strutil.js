import { Base64 } from "js-base64";
import { len, throwIf } from "./util";

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

const code0 = "0".charCodeAt(0);
const code7 = "7".charCodeAt(0);
const code9 = "9".charCodeAt(0);
const codeA = "a".charCodeAt(0);
const codeH = "h".charCodeAt(0);
const codeX = "x".charCodeAt(0);
const codeB = "b".charCodeAt(0);
const codeO = "O".charCodeAt(0);
const codeo = "o".charCodeAt(0);
const codeUnder = "_".charCodeAt(0);

function isCharDec(c) {
  return c >= code0 && c <= code9;
}

function hexToNum(c) {
  if (c >= code0 && c <= code9) {
    return c - code0;
  }
  if (c >= codeA && c <= codeH) {
    return 10 + c - codeA;
  }
  return -1;
}

function decToNum(c) {
  if (c >= code0 && c <= code9) {
    return c - code0;
  }
  return -1;
}

function octToNum(c) {
  if (c >= code0 && c <= code7) {
    return c - code0;
  }
  return -1;
}

/**
 * @param {string} s
 * @returns {number}
 */
export function parseNumFlexible(s) {
  let res = 0;
  let slen = s.length;
  let n;
  /* states:
  0 - initial
  1 - after 0
  2 - parsing dec
  3 - parsing hex
  4 - parsing oct
  5 - parsing binary
  */
  let state = 0;
  for (let i = 0; i < slen; i++) {
    let c = s.charCodeAt(i);
    switch (state) {
      case 0:
        if (c === code0) {
          state = 1;
        } else if (isCharDec(c)) {
          res = c - code0;
          state = 2;
        } else {
          return null;
        }
        break;
      case 1:
        // we parsed 0, so it can be x, b, 0 or dec
        if (c === codeX) {
          state = 3;
        } else if (c === codeB) {
          state = 5;
        } else if (c === codeO || c === codeo) {
          state = 4;
        } else if (isCharDec(c)) {
          state = 2;
          res = c - code0;
        } else {
          return null;
        }
        break;
      case 2:
        n = decToNum(c);
        if (n < 0) {
          return null;
        } else {
          res = res * 10 + n;
        }
        break;
      case 3:
        n = hexToNum(c);
        if (n < 0) {
          return null;
        } else {
          res = res * 16 + n;
        }
        break;
      case 4:
        n = octToNum(c);
        if (n < 0) {
          return null;
        } else {
          res = res * 8 + n;
        }
        break;
      case 5:
        if (c === codeUnder) {
          // do nothing
        } else {
          n = c - code0;
          if (n < 2) {
            res = res * 2 + n;
          } else {
            return null;
          }
        }
        break;
      default:
        throwIf(true, "invalid state");
    }
  }
  return res;
}

/**
 * @param {string} s
 * @returns {string}
 */
export function numToHex(s) {
  return s;
}
