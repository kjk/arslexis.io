import { describe, test as it } from "bun:test";
import { streq } from "./testhelpers";

import {
  b64EncodeStandard,
  b64EncodeURLSafe,
  b64EncodeHtmlImage,
  b64Decode,
  b64DecodeAsHex,
  urlEncode,
  urlDecode,
  strCompressWS,
  parseNumFlexible,
} from "./strutil";
import ist from "ist";

describe("strUtils", () => {
  it("strCompressWS", () => {
    function t(s, want) {
      let got = strCompressWS(s);
      streq(got, want);
    }
    t("", "");
    t(" ", " ");
    t("  ", " ");
    t("as  \t\nb", "as b");
    t("as  \t\nb\t\t", "as b ");
    t("\t\ta  b", " a b");
    t("\t\tf \t ", " f ");
  });

  it("b64", () => {
    // order: string, standard, url-safe, html image, decode as hex
    const a = [
      [
        "as?-. fd",
        "YXM/LS4gZmQ=",
        "YXM_LS4gZmQ=",
        `<img src="data:image/py;base64,YXM/LS4gZmQ=" />`,
        "61 73 3F 2D 2E 20 66 64 ",
      ],
    ];
    for (let el of a) {
      let s = el[0];

      let got = b64EncodeStandard(s);
      streq(got, el[1]);

      let dec = b64Decode(got);
      streq(dec, s);

      got = b64EncodeURLSafe(s);
      streq(got, el[2]);

      dec = b64Decode(got);
      streq(dec, s);

      dec = b64DecodeAsHex(got);
      streq(dec, el[4]);

      got = b64EncodeHtmlImage(s);
      streq(got, el[3]);
    }
  });

  it("urlEncodeDecode", () => {
    const a = [
      [
        `https://foo.com/lo + _ as / me ? lost - \ .`,
        "https://foo.com/lo%20+%20_%20as%20/%20me%20?%20lost%20-%20%20.",
        // TODO: notepad2 returns:
        // https://foo.com/lo%20+%20_%20as%20/%20me%20? lost - \ .
      ],
    ];
    for (let el of a) {
      let s = el[0];
      let got = urlEncode(s);
      streq(got, el[1]);

      let dec = urlDecode(got);
      streq(dec, s);
    }
  });

  it("num", () => {
    ist(parseNumFlexible("1234"), 1234);
    ist(parseNumFlexible("0x4d2"), 1234);
    ist(parseNumFlexible("0b100_11010010"), 1234);
    ist(parseNumFlexible("0O2322"), 1234);
    ist(parseNumFlexible("0o2322"), 1234);
    ist(parseNumFlexible("a1234"), null);
  });
});
