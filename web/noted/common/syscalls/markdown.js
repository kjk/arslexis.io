import { parse } from "../markdown_parser/parse_tree.ts";
export function markdownSyscalls(lang) {
  return {
    "markdown.parseMarkdown": (_ctx, text) => {
      return parse(lang, text);
    }
  };
}
