export function throttle(func, limit) {
  let timer = null;
  return function() {
    if (!timer) {
      timer = setTimeout(() => {
        func();
        timer = null;
      }, limit);
    }
  };
}
export function race(promises) {
  return new Promise((resolve, reject) => {
    for (const p of promises) {
      p.then(resolve, reject);
    }
  });
}
export function timeout(ms) {
  return new Promise(
    (_resolve, reject) => setTimeout(() => {
      reject(new Error("timeout"));
    }, ms)
  );
}
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
