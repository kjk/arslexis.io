import buildMarkdown from "../../common/markdown_parser/parser.js";
import { parse } from "../../common/markdown_parser/parse_tree.js";
import { System } from "../../plugos/system.js";
import corePlug from "../../dist_bundle/_plug/core.plug.json" assert { type: "json" };
import tasksPlug from "../../dist_bundle/_plug/tasks.plug.json" assert { type: "json" };
import { createSandbox } from "../../plugos/environments/deno_sandbox.js";
import { loadMarkdownExtensions } from "../../common/markdown_parser/markdown_ext.js";
import { renderMarkdownToHtml } from "./markdown_render.js";
import { assertEquals } from "../../test_deps.js";
import { urlToPathname } from "../../plugos/util.js";
Deno.test("Markdown render", async () => {
  const system = new System("server");
  await system.load(corePlug, createSandbox);
  await system.load(tasksPlug, createSandbox);
  const lang = buildMarkdown(loadMarkdownExtensions(system));
  const testFile = Deno.readTextFileSync(
    urlToPathname(new URL("test/example.md", import.meta.url))
  );
  const tree = parse(lang, testFile);
  renderMarkdownToHtml(tree, {
    failOnUnknown: true,
    renderFrontMatter: true,
  });
});
Deno.test("Smart hard break test", async () => {
  const example = `**Hello**
*world!*`;
  const lang = buildMarkdown([]);
  const tree = parse(lang, example);
  const html = await renderMarkdownToHtml(tree, {
    failOnUnknown: true,
    smartHardBreak: true,
  });
  assertEquals(html, `<p><strong>Hello</strong><br/><em>world!</em></p>`);
});
