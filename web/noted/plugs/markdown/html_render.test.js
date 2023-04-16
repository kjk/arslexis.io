import { assertEquals } from "https://deno.land/std@0.165.0/testing/asserts.js";
import { renderHtml } from "./html_render.js";
Deno.test("HTML Render", () => {
  assertEquals(
    renderHtml({
      name: "b",
      body: "hello",
    }),
    `<b>hello</b>`
  );
  assertEquals(
    renderHtml({
      name: "a",
      attrs: {
        href: "https://example.com",
      },
      body: "hello",
    }),
    `<a href="https://example.com">hello</a>`
  );
  assertEquals(
    renderHtml({
      name: "span",
      body: "<>",
    }),
    `<span>&lt;&gt;</span>`
  );
});
