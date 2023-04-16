export const Fragment = "FRAGMENT";
function htmlEscape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
export function renderHtml(t) {
  if (!t) {
    return "";
  }
  if (typeof t === "string") {
    return htmlEscape(t);
  }
  const attrs = t.attrs ? " " + Object.entries(t.attrs).filter(([, value]) => value !== void 0).map(([k, v]) => `${k}="${htmlEscape(v)}"`).join(
    " "
  ) : "";
  const body = typeof t.body === "string" ? htmlEscape(t.body) : t.body.map(renderHtml).join("");
  if (t.name === Fragment) {
    return body;
  }
  if (t.body) {
    return `<${t.name}${attrs}>${body}</${t.name}>`;
  } else {
    return `<${t.name}${attrs}/>`;
  }
}
