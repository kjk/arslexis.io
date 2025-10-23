import { expect, test } from "bun:test";

import { stripExt } from "./util";

test("stripExt", () => {
  expect(stripExt("foo.txt")).toBe("foo");
});
