import { Decoration, syntaxTree } from "../deps.js";
import {
  LinkWidget,
  decoratorStateField,
  invisibleDecoration,
  isCursorInRange,
} from "./util.js";

import { pageLinkRegex } from "../../common/markdown_parser/parser.js";

export function cleanWikiLinkPlugin(editor) {
  return decoratorStateField((state) => {
    const widgets = [];
    syntaxTree(state).iterate({
      enter: ({ type, from, to }) => {
        if (type.name !== "WikiLink") {
          return;
        }
        const text = state.sliceDoc(from, to);
        const match = pageLinkRegex.exec(text);
        if (!match) return;
        const [_fullMatch, page, pipePart, alias] = match;
        const allPages = editor.space.listPages();
        let pageExists = false;
        let cleanPage = page;
        if (page.includes("@")) {
          cleanPage = page.split("@")[0];
        }
        for (const pageMeta of allPages) {
          if (pageMeta.name === cleanPage) {
            pageExists = true;
            break;
          }
        }
        if (cleanPage === "" || cleanPage.startsWith("\u{1F4AD}")) {
          pageExists = true;
        }
        if (isCursorInRange(state, [from, to])) {
          if (!pageExists) {
            widgets.push(
              Decoration.mark({
                class: "sb-wiki-link-page-missing",
              }).range(from + 2, from + page.length + 2)
            );
          }
          return;
        }
        widgets.push(invisibleDecoration.range(from, to));
        let linkText = alias || page;
        if (!pipePart && text.indexOf("/") !== -1) {
          linkText = page.split("/").pop();
        }
        widgets.push(
          Decoration.widget({
            widget: new LinkWidget({
              text: linkText,
              title: pageExists ? `Navigate to ${page}` : `Create ${page}`,
              href: `/${page.replaceAll(" ", "_")}`,
              cssClass: pageExists
                ? "sb-wiki-link-page"
                : "sb-wiki-link-page-missing",
              callback: (e) => {
                if (e.altKey) {
                  return editor.editorView.dispatch({
                    selection: { anchor: from + 2 },
                  });
                }
                const clickEvent = {
                  page: editor.currentPage,
                  ctrlKey: e.ctrlKey,
                  metaKey: e.metaKey,
                  altKey: e.altKey,
                  pos: from,
                };
                editor
                  .dispatchAppEvent("page:click", clickEvent)
                  .catch(console.error);
              },
            }),
          }).range(from)
        );
      },
    });
    return Decoration.set(widgets, true);
  });
}
