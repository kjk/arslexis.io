import { parse } from "../markdown_parser/parse_tree.js";
export function markdownSyscalls(lang) {
  return {
    "markdown.parseMarkdown": (_ctx, text) => {
      return parse(lang, text);
    },
  };
}
