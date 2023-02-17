export function logEvent(name, durMs = 0, meta = {}) {
  console.log(`event: '${name}' took ${durMs} ms`);
}
