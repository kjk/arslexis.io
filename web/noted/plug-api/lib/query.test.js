import { assert, assertEquals } from "../../test_deps.js";

import { parse } from "../../common/markdown_parser/parse_tree.js";
import { removeQueries } from "./query.js";
import { renderToText } from "./tree.js";
import wikiMarkdownLang from "../../common/markdown_parser/parser.js";
const queryRemovalTest = `
# Heading
Before
<!-- #query page -->
Bla bla remove me
<!-- /query -->
End
`;
Deno.test("White out queries", () => {
  const lang = wikiMarkdownLang([]);
  const mdTree = parse(lang, queryRemovalTest);
  removeQueries(mdTree);
  const text = renderToText(mdTree);
  assertEquals(text.length, queryRemovalTest.length);
  assert(text.indexOf("remove me") === -1);
  console.log("Whited out text", text);
});
