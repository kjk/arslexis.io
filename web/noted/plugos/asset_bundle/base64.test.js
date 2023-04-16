import {
  base64Decode,
  base64DecodeDataUrl,
  base64EncodedDataUrl,
} from "./base64.js";

import { assertEquals } from "../../test_deps.js";
import { base64Encode } from "./base64.js";
Deno.test("Base 64 encoding", () => {
  const buf = new Uint8Array(3);
  buf[0] = 1;
  buf[1] = 2;
  buf[2] = 3;
  assertEquals(buf, base64Decode(base64Encode(buf)));
  assertEquals(
    buf,
    base64DecodeDataUrl(base64EncodedDataUrl("application/octet-stream", buf))
  );
});
