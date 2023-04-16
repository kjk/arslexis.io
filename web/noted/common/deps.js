export {
  history,
  historyKeymap,
  indentWithTab,
  standardKeymap,
} from "@codemirror/commands";
export {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  CompletionContext,
  completionKeymap,
} from "@codemirror/autocomplete";
export { styleTags, Tag, tagHighlighter, tags } from "@lezer/highlight";
export * as YAML from "yaml"; // TODO: https://deno.land/std@0.177.0/encoding/yaml.ts, ported from js-yaml
// export * as YAML from "https://deno.land/std@0.177.0/encoding/yaml.ts";
// export * as path from "https://deno.land/std@0.177.0/path/mod.ts";
// export { readAll } from "https://deno.land/std@0.165.0/streams/conversion.js";
export {
  Emoji,
  GFM,
  MarkdownParser,
  parseCode,
  parser as baseParser,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  TaskList,
} from "@lezer/markdown";
export { searchKeymap } from "@codemirror/search";
export {
  Decoration,
  drawSelection,
  dropCursor,
  EditorView,
  highlightSpecialChars,
  keymap,
  placeholder,
  runScopeHandlers,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
export { markdown } from "@codemirror/lang-markdown";
export {
  EditorSelection,
  EditorState,
  Range,
  SelectionRange,
  StateField,
  Text,
  Transaction,
} from "@codemirror/state";
export {
  defaultHighlightStyle,
  defineLanguageFacet,
  foldedRanges,
  foldInside,
  foldNodeProp,
  HighlightStyle,
  indentNodeProp,
  indentOnInput,
  Language,
  languageDataProp,
  LanguageDescription,
  LanguageSupport,
  ParseContext,
  StreamLanguage,
  syntaxHighlighting,
  syntaxTree,
} from "@codemirror/language";
export { yaml as yamlLanguage } from "@codemirror/legacy-modes/mode/yaml";
export {
  pgSQL as postgresqlLanguage,
  standardSQL as sqlLanguage,
} from "@codemirror/legacy-modes/mode/sql";
export { rust as rustLanguage } from "@codemirror/legacy-modes/mode/rust";
export { css as cssLanguage } from "@codemirror/legacy-modes/mode/css";
export { python as pythonLanguage } from "@codemirror/legacy-modes/mode/python";
export { protobuf as protobufLanguage } from "@codemirror/legacy-modes/mode/protobuf";
export { shell as shellLanguage } from "@codemirror/legacy-modes/mode/shell";
export { swift as swiftLanguage } from "@codemirror/legacy-modes/mode/swift";
export { toml as tomlLanguage } from "@codemirror/legacy-modes/mode/toml";
export { xml as xmlLanguage } from "@codemirror/legacy-modes/mode/xml";
export { json as jsonLanguage } from "@codemirror/legacy-modes/mode/javascript";
export {
  c as cLanguage,
  cpp as cppLanguage,
  csharp as csharpLanguage,
  dart as dartLanguage,
  java as javaLanguage,
  kotlin as kotlinLanguage,
  objectiveC as objectiveCLanguage,
  objectiveCpp as objectiveCppLanguage,
  scala as scalaLanguage,
} from "@codemirror/legacy-modes/mode/clike";
export {
  javascriptLanguage,
  typescriptLanguage,
} from "@codemirror/lang-javascript";
