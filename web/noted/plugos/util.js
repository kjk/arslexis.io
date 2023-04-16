export function safeRun(fn) {
  fn().catch((e) => {
    console.error("Caught error", e.message);
  });
}
export function urlToPathname(url) {
  return url.pathname.replace(/^\/(\w:)/, "$1");
}
