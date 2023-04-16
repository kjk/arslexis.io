import { editor, markdown, system } from "$sb/silverbullet-syscall/mod.js";
import {
  removeParentPointers,
  renderToText,
  traverseTree,
} from "$sb/lib/tree.js";

import { extractFrontmatter } from "$sb/lib/frontmatter.js";
import { renderDirectives } from "./directives.js";
export async function updateDirectivesOnPageCommand(arg) {
  const explicitCall = typeof arg !== "string";
  const pageName = await editor.getCurrentPage();
  const text = await editor.getText();
  const tree = await markdown.parseMarkdown(text);
  const metaData = extractFrontmatter(tree, ["$disableDirectives"]);
  if (metaData.$disableDirectives) {
    return;
  }
  if (metaData.$share) {
    for (const uri of metaData.$share) {
      if (uri.startsWith("collab:")) {
        if (explicitCall) {
          await editor.flashNotification(
            "Directives are disabled for 'collab' pages (safety reasons).",
            "error"
          );
        }
        return;
      }
    }
  }
  const replacements = [];
  const allPromises = [];
  removeParentPointers(tree);
  traverseTree(tree, (tree2) => {
    if (tree2.type !== "Directive") {
      return false;
    }
    const fullMatch = text.substring(tree2.from, tree2.to);
    try {
      const promise = system.invokeFunction(
        "server",
        "serverRenderDirective",
        pageName,
        tree2
      );
      replacements.push({
        textPromise: promise,
        fullMatch,
      });
      allPromises.push(promise);
    } catch (e) {
      replacements.push({
        fullMatch,
        textPromise: Promise.resolve(
          `${renderToText(tree2.children[0])}
**ERROR:** ${e.message}
${renderToText(tree2.children[tree2.children.length - 1])}`
        ),
      });
    }
    return true;
  });
  await Promise.all(allPromises);
  for (const replacement of replacements) {
    const text2 = await editor.getText();
    const index = text2.indexOf(replacement.fullMatch);
    if (index === -1) {
      console.warn("Text I got", text2);
      console.warn(
        "Could not find directive in text, skipping",
        replacement.fullMatch
      );
      continue;
    }
    const from = index,
      to = index + replacement.fullMatch.length;
    const newText = await replacement.textPromise;
    if (text2.substring(from, to) === newText) {
      continue;
    }
    await editor.dispatch({
      changes: {
        from,
        to,
        insert: newText,
      },
    });
  }
}
export function serverRenderDirective(pageName, tree) {
  return renderDirectives(pageName, tree);
}
export async function serverUpdateDirectives(pageName, text) {
  const tree = await markdown.parseMarkdown(text);
  const replacements = [];
  const allPromises = [];
  traverseTree(tree, (tree2) => {
    if (tree2.type !== "Directive") {
      return false;
    }
    const fullMatch = text.substring(tree2.from, tree2.to);
    try {
      const promise = renderDirectives(pageName, tree2);
      replacements.push({
        textPromise: promise,
        fullMatch,
      });
      allPromises.push(promise);
    } catch (e) {
      replacements.push({
        fullMatch,
        textPromise: Promise.resolve(
          `${renderToText(tree2.children[0])}
**ERROR:** ${e.message}
${renderToText(tree2.children[tree2.children.length - 1])}`
        ),
      });
    }
    return true;
  });
  await Promise.all(allPromises);
  for (const replacement of replacements) {
    text = text.replace(replacement.fullMatch, await replacement.textPromise);
  }
  return text;
}
