import { assert, it } from "vitest";

import { stripExt } from "./util";

it("stripExt", () => {
  assert.equal(stripExt("foo.txt"), "foo");
});
