import { events } from "$sb/plugos-syscall/mod.js";
import { jsonToMDTable } from "./util.js";
import { parseQuery } from "./parser.js";
import { renderTemplate } from "./util.js";
import { replaceTemplateVars } from "../core/template.js";
export async function queryDirectiveRenderer(_directive, pageName, query) {
  if (typeof query === "string") {
    throw new Error("Argument must be a ParseTree");
  }
  const parsedQuery = parseQuery(
    JSON.parse(replaceTemplateVars(JSON.stringify(query), pageName))
  );
  const eventName = `query:${parsedQuery.table}`;
  const results = await events.dispatchEvent(
    eventName,
    { query: parsedQuery, pageName },
    30 * 1e3
  );
  if (results.length === 0) {
    return `**Error:** Unsupported query source '${parsedQuery.table}'`;
  } else if (results.length === 1) {
    if (parsedQuery.render) {
      const rendered = await renderTemplate(parsedQuery.render, results[0]);
      return rendered.trim();
    } else {
      if (results[0].length === 0) {
        return "No results";
      } else {
        return jsonToMDTable(results[0]);
      }
    }
  } else {
    throw new Error(`Too many query results: ${results.length}`);
  }
}
