import * as YAML from "yaml";

import { jsonToMDTable, renderTemplate } from "./util.js";
function translateJs(js) {
  return js.replaceAll(/(\w+\.\w+)\s*\(/g, 'await invokeFunction("$1", ');
}
const expressionRegex = /(.+?)(\s+render\s+\[\[([^\]]+)\]\])?$/;
export async function evalDirectiveRenderer(_directive, _pageName, expression) {
  if (typeof expression !== "string") {
    throw new Error("Expected a string");
  }
  console.log("Got JS expression", expression);
  const match = expressionRegex.exec(expression);
  if (!match) {
    throw new Error(`Invalid eval directive: ${expression}`);
  }
  let template = "";
  if (match[3]) {
    expression = match[1];
    template = match[3];
  }
  try {
    const result = await (0, eval)(
      `(async () => { 
        function invokeFunction(name, ...args) {
          return syscall("system.invokeFunction", "server", name, ...args);
        }
        return ${translateJs(expression)};
      })()`
    );
    if (template) {
      return await renderTemplate(template, result);
    }
    if (typeof result === "string") {
      return result;
    } else if (typeof result === "number") {
      return "" + result;
    } else if (Array.isArray(result)) {
      return jsonToMDTable(result);
    }
    return YAML.stringify(result);
  } catch (e) {
    return `**ERROR:** ${e.message}`;
  }
}
