import { SqliteError } from "./error.js";
export function setStr(wasm, str, closure) {
  const bytes = new TextEncoder().encode(str);
  const ptr = wasm.malloc(bytes.length + 1);
  if (ptr === 0) {
    throw new SqliteError("Out of memory.");
  }
  const mem = new Uint8Array(wasm.memory.buffer, ptr, bytes.length + 1);
  mem.set(bytes);
  mem[bytes.length] = 0;
  try {
    const result = closure(ptr);
    wasm.free(ptr);
    return result;
  } catch (error) {
    wasm.free(ptr);
    throw error;
  }
}
export function setArr(wasm, arr, closure) {
  const ptr = wasm.malloc(arr.length);
  if (ptr === 0) {
    throw new SqliteError("Out of memory.");
  }
  const mem = new Uint8Array(wasm.memory.buffer, ptr, arr.length);
  mem.set(arr);
  try {
    const result = closure(ptr);
    wasm.free(ptr);
    return result;
  } catch (error) {
    wasm.free(ptr);
    throw error;
  }
}
export function getStr(wasm, ptr) {
  const len = wasm.str_len(ptr);
  const bytes = new Uint8Array(wasm.memory.buffer, ptr, len);
  if (len > 16) {
    return new TextDecoder().decode(bytes);
  } else {
    let str = "";
    let idx = 0;
    while (idx < len) {
      let u0 = bytes[idx++];
      if (!(u0 & 128)) {
        str += String.fromCharCode(u0);
        continue;
      }
      const u1 = bytes[idx++] & 63;
      if ((u0 & 224) == 192) {
        str += String.fromCharCode(((u0 & 31) << 6) | u1);
        continue;
      }
      const u2 = bytes[idx++] & 63;
      if ((u0 & 240) == 224) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (bytes[idx++] & 63);
      }
      if (u0 < 65536) {
        str += String.fromCharCode(u0);
      } else {
        const ch = u0 - 65536;
        str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
      }
    }
    return str;
  }
}
