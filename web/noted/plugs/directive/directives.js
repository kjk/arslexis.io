import {
  cleanTemplateInstantiations,
  templateDirectiveRenderer,
} from "./template_directive.js";

import { evalDirectiveRenderer } from "./eval_directive.js";
import { queryDirectiveRenderer } from "./query_directive.js";
import { renderToText } from "$sb/lib/tree.js";
export const directiveStartRegex =
  /<!--\s*#(use|use-verbose|include|eval|query)\s+(.*?)-->/i;
export const directiveRegex =
  /(<!--\s*#(use|use-verbose|include|eval|query)\s+(.*?)-->)(.+?)(<!--\s*\/\2\s*-->)/gs;
export async function directiveDispatcher(
  pageName,
  directiveTree,
  directiveRenderers
) {
  const directiveStart = directiveTree.children[0];
  const directiveEnd = directiveTree.children[2];
  const directiveStartText = renderToText(directiveStart).trim();
  const directiveEndText = renderToText(directiveEnd).trim();
  if (directiveStart.children.length === 1) {
    const match = directiveStartRegex.exec(directiveStart.children[0].text);
    if (!match) {
      throw Error("No match");
    }
    let [_fullMatch, type, arg] = match;
    try {
      arg = arg.trim();
      const newBody = await directiveRenderers[type](type, pageName, arg);
      const result = `${directiveStartText}
${newBody.trim()}
${directiveEndText}`;
      return result;
    } catch (e) {
      return `${directiveStartText}
**ERROR:** ${e.message}
${directiveEndText}`;
    }
  } else {
    const newBody = await directiveRenderers["query"](
      "query",
      pageName,
      directiveStart.children[1]
    );
    const result = `${directiveStartText}
${newBody.trim()}
${directiveEndText}`;
    return result;
  }
}
export async function renderDirectives(pageName, directiveTree) {
  const replacementText = await directiveDispatcher(pageName, directiveTree, {
    use: templateDirectiveRenderer,
    include: templateDirectiveRenderer,
    query: queryDirectiveRenderer,
    eval: evalDirectiveRenderer,
  });
  return cleanTemplateInstantiations(replacementText);
}
