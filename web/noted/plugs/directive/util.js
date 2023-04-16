import * as YAML from "yaml";

import Handlebars from "handlebars";
import { niceDate } from "$sb/lib/dates.js";
import { space } from "$sb/silverbullet-syscall/mod.js";
const maxWidth = 70;
export function defaultJsonTransformer(_k, v) {
  if (v === void 0) {
    return "";
  }
  return "" + v;
}
export function jsonToMDTable(
  jsonArray,
  valueTransformer = defaultJsonTransformer
) {
  const fieldWidths = /* @__PURE__ */ new Map();
  for (const entry of jsonArray) {
    for (const k of Object.keys(entry)) {
      let fieldWidth = fieldWidths.get(k);
      if (!fieldWidth) {
        fieldWidth = valueTransformer(k, entry[k]).length;
      } else {
        fieldWidth = Math.max(valueTransformer(k, entry[k]).length, fieldWidth);
      }
      fieldWidths.set(k, fieldWidth);
    }
  }
  let fullWidth = 0;
  for (const v of fieldWidths.values()) {
    fullWidth += v + 1;
  }
  const headerList = [...fieldWidths.keys()];
  const lines = [];
  lines.push(
    "|" +
      headerList
        .map(
          (headerName) =>
            headerName +
            charPad(" ", fieldWidths.get(headerName) - headerName.length)
        )
        .join("|") +
      "|"
  );
  lines.push(
    "|" +
      headerList
        .map((title) => charPad("-", fieldWidths.get(title)))
        .join("|") +
      "|"
  );
  for (const val of jsonArray) {
    const el = [];
    for (const prop of headerList) {
      const s = valueTransformer(prop, val[prop]);
      el.push(s + charPad(" ", fieldWidths.get(prop) - s.length));
    }
    lines.push("|" + el.join("|") + "|");
  }
  return lines.join("\n");
  function charPad(ch, length) {
    if (fullWidth > maxWidth && ch === "") {
      return "";
    } else if (fullWidth > maxWidth && ch === "-") {
      return "--";
    }
    if (length < 1) {
      return "";
    }
    return new Array(length + 1).join(ch);
  }
}
export async function renderTemplate(renderTemplate2, data) {
  Handlebars.registerHelper("json", (v) => JSON.stringify(v));
  Handlebars.registerHelper("niceDate", (ts) => niceDate(new Date(ts)));
  Handlebars.registerHelper("prefixLines", (v, prefix) =>
    v
      .split("\n")
      .map((l) => prefix + l)
      .join("\n")
  );
  Handlebars.registerHelper("substring", (s, from, to, elipsis = "") =>
    s.length > to - from ? s.substring(from, to) + elipsis : s
  );
  Handlebars.registerHelper("yaml", (v, prefix) => {
    if (typeof prefix === "string") {
      let yaml = YAML.stringify(v)
        .split("\n")
        .join("\n" + prefix)
        .trim();
      if (Array.isArray(v)) {
        return "\n" + prefix + yaml;
      } else {
        return yaml;
      }
    } else {
      return YAML.stringify(v).trim();
    }
  });
  let templateText = await space.readPage(renderTemplate2);
  templateText = `{{#each .}}
${templateText}
{{/each}}`;
  const template = Handlebars.compile(templateText, { noEscape: true });
  return template(data);
}
