export function len(o: any): number {
  if (o && o.length) {
    return o.length;
  }
  return 0;
}

export function lazyLoadScript(src: string, opts: any = {}): Promise<any> {
  return new Promise(function (resolve, reject) {
    if (!src) {
      throw new Error("src parameter must be specified");
    }

    const defaults = {
      force: false,
      async: true,
    };

    if (typeof opts === "string") {
      opts = {
        id: opts,
      };
    }

    opts = Object.assign({}, defaults, opts);
    const script = document.createElement("script");

    const id = opts.id;
    script.src = src;
    if (id) {
      script.setAttribute("id", id);
      if (document.getElementById(id)) {
        // console.log(`already loaded ${src}`);
        resolve(document.getElementById(id));
        return;
      }
    } else {
      const sc = document.querySelector(`script[src="${src}"]`);
      if (!opts.force && sc) {
        // console.log(`already loaded ${src}`);
        resolve(sc);
        return;
      }
    }

    if (opts.async) script.setAttribute("async", "true");
    if (opts.defer) script.setAttribute("defer", "true");
    if (opts.integrity) script.setAttribute("integrity", opts.integrity);
    if (opts.type) script.setAttribute("type", opts.type);
    if (opts.text) script.setAttribute("text", opts.text);
    if (opts.charset) script.setAttribute("charset", opts.charset);
    if (opts.crossorigin) script.setAttribute("crossorigin", opts.crossorigin);

    // @ts-ignore
    script.onload = function (event) {
      // console.log(`loaded ${src}`);
      resolve(script);
    };
    script.onerror = function (event) {
      reject(event);
    };
    document.body.appendChild(script);
  });
}

export function lazyLoadCSS(src: string, opts: any = {}): Promise<any> {
  // @ts-ignore
  return new Promise(function (resolve, reject) {
    if (!src) {
      throw new Error("src parameter must be specified");
    }

    const defaults = {
      media: "all",
      rel: "stylesheet",
      type: "text/css",
      force: false,
    };

    const { id, media, rel, type, force } = Object.assign(
      {},
      defaults,
      typeof opts === "string"
        ? {
            id: opts,
          }
        : opts
    );

    const link = document.createElement("link");
    link.setAttribute("rel", rel);
    link.setAttribute("type", type);
    link.setAttribute("href", src);
    link.setAttribute("media", media);
    if (id) {
      if (!force && document.getElementById(id)) {
        // console.log(`already loaded ${src}`);
        resolve(document.getElementById(id));
        return;
      }
      link.setAttribute("id", id);
    } else {
      const li = document.head.querySelector(
        `link[rel="${rel}"][href="${src}"]`
      );
      if (li) {
        // console.log(`already loaded ${src}`);
        resolve(li);
        return;
      }
    }
    // @ts-ignore
    link.onload = function (event) {
      // console.log(`loaded ${src}`);
      resolve(link);
    };
    document.head.appendChild(link);
  });
}

export function clamp(n: number, min: number, max: number): number {
  if (n < min) {
    return min;
  }
  if (n > max) {
    return max;
  }
  return n;
}

export function fileExt(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx === -1) {
    return "";
  }
  const ext = fileName.substring(idx);
  return ext.toLowerCase();
}

export function inflect(s: string, n: number): string {
  if (n == 1) {
    return s;
  }
  return s + "s";
}

// TODO: move those t log.js
// TODO: don't log in production unless a debugging enabled
export function log(args) {
  console.log(args);
}

export function warn(args) {
  console.warn(args);
}

// TODO: this should be logged as an event
export function error(args) {
  console.error(args);
}

// returns a function that, when called, returns number of elapsed milliseconds
export function startTimer() {
  const timeStart = performance.now();
  return function () {
    return Math.round(performance.now() - timeStart);
  };
}

export function getLocalStorageAsJSON(key: string) {
  // console.log("getLocalStorageAsJSON:", key);
  const v = localStorage.getItem(key);
  if (v) {
    // console.log("  v:", v);
    return JSON.parse(v);
  }
  return null;
}

export function setLocalStorageFromJSON(key: string, js: any) {
  const s = JSON.stringify(js);
  // console.log("setLocalStorageFromJSON:", key, "size:", len(s));
  localStorage.setItem(key, s);
}

/**
 * Reduce calls to the passed function.
 *
 * @param func - Function to debounce.
 * @param threshold - The delay to avoid recalling the function.
 * @param execAsap - If true, the Function is called at the start of the threshold, otherwise the Function is called at the end of the threshold.
 */
export function debounce(func, threshold, execAsap = false) {
  let timeout;
  return function debounced(...args) {
    const self = this;
    if (timeout) clearTimeout(timeout);
    else if (execAsap) func.apply(self, args);
    timeout = setTimeout(delayed, threshold || 100);
    function delayed() {
      if (!execAsap) func.apply(self, args);
      timeout = null;
    }
  };
}

export function throwIf(cond: boolean, msg?: string) {
  if (cond) {
    throw new Error(msg || "invalid condition");
  }
}

// TODO: doesn't belong here but in gisteditor
const adText = "(made with https://codeeval.dev)";
export function removeDescriptionAd(s: string): string {
  if (!s) {
    return "";
  }
  if (!s.includes(adText)) {
    return s;
  }
  s = s.replace(adText, "");
  return s.trim();
}

export function fnNoOp() {
  // just a no-op function
  // more efficient than doing () => {} many times
}

// https://svelte.dev/examples/modal
export function trapFocus(parent: any, e: KeyboardEvent) {
  const nodes = parent.querySelectorAll("*:not([disabled])");
  const tabbable = Array.from(nodes).filter((n) => n.tabIndex >= 0);

  let index = tabbable.indexOf(document.activeElement);
  if (index === -1 && e.shiftKey) index = 0;

  index += tabbable.length + (e.shiftKey ? -1 : 1);
  index %= tabbable.length;

  tabbable[index].focus();
}

/*
// https://hidde.blog/using-javascript-to-trap-focus-in-an-element/
export function trapFocus2(parent, e) {
  // re-get focusable elements because disabled state might change
  var focusableEls = parent.querySelectorAll(
    'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])'
  );
  // console.log("focusableEls:", focusableEls);
  var firstFocusableEl = focusableEls[0];
  var lastFocusableEl = focusableEls[focusableEls.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === firstFocusableEl) {
      // console.log("trapped to lastFocusableEl", lastFocusableEl);
      lastFocusableEl.focus();
    }
  } else {
    if (document.activeElement === lastFocusableEl) {
      // console.log("trapped to firstFocusableEl:", firstFocusableEl);
      firstFocusableEl.focus();
    }
  }
}
*/

export function fmtSize(n: number): string {
  const a: [number, string][] = [
    [1024 * 1024 * 1024 * 1024, "TB"],
    [1024 * 1024 * 1024, "GB"],
    [1024 * 1024, "MB"],
    [1024, "kB"],
  ];
  for (const el of a) {
    const size = el[0];
    if (n >= size) {
      let s = (n / size).toFixed(2);
      return s.replace(".00", "") + " " + el[1];
    }
  }
  return `${n} B`;
}

export function fmtNum(n: number, sep: string = ","): string {
  // TODO: maybe n.toLocaleString("en-US").replaceAll(",", ".");
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

export function notepad2Size(n: number): string {
  const sizes = [
    1024 * 1024 * 1024 * 1024,
    1024 * 1024 * 1024,
    1024 * 1024,
    1024,
  ];
  const suffixes = ["TB", "GB", "MB", "kB"];
  for (let i = 0; i < len(sizes); i++) {
    const size = sizes[i];
    if (n >= size) {
      let s = (n / size).toFixed(2);
      return s.replace(".00", "") + " " + suffixes[i];
    }
  }
  return `${n} bytes`;
}

export function preventDefaults(e) {
  //console.log("preventDefaults");
  e.preventDefault();
  e.stopPropagation();
}

export function preventDragOnElement(el) {
  //console.log("preventDragOnElement", el);
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    el.addEventListener(eventName, preventDefaults, false);
  });
}

export function undoPreventDragOnElement(el) {
  //console.log("preventDragOnElement", el);
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    el.addEventListener(eventName, preventDefaults, false);
  });
}

// Wrap readEntries in a promise to make working with readEntries easier
export async function readEntriesPromise(directoryReader) {
  try {
    return await new Promise((resolve, reject) => {
      directoryReader.readEntries(resolve, reject);
    });
  } catch (err) {
    console.log(err);
  }
}

export async function collectAllDirectoryEntries(directoryReader, queue) {
  let readEntries = await readEntriesPromise(directoryReader);
  while (readEntries.length > 0) {
    queue.push(...readEntries);
    readEntries = await readEntriesPromise(directoryReader);
  }
}

export async function getAllFileEntries(dataTransferItemList: DataTransferItemList): Promise<FileSystemEntry[]> {
  let fileEntries: FileSystemEntry[] = [];
  let queue: FileSystemEntry[] = [];
  let n = dataTransferItemList.length;
  for (let i = 0; i < n; i++) {
    let item = dataTransferItemList[i];
    let entry = item.webkitGetAsEntry();
    if (!entry) {
      continue;
    }
    queue.push(entry);
  }
  while (len(queue) > 0) {
    let entry = queue.shift();
    if (entry.isFile) {
      fileEntries.push(entry);
    } else if (entry.isDirectory) {
      // @ts-ignore
      let reader = entry.createReader();
      await collectAllDirectoryEntries(reader, queue);
    }
  }
  return fileEntries;
}

export class FileWithPath {
  file: File;
  path = "";
  constructor(file, path) {
    this.file = file;
    this.path = path;
  }
}

export function filterFiles(files: FileList, fnAllowed: Function): FileWithPath[] {
  let res: FileWithPath[] = [];
  for (const file of files) {
    if (fnAllowed && !fnAllowed(file.name)) {
      console.log(`${file.name} is not a supported file type`);
      continue;
    }

    let f = new FileWithPath(file, file.name);
    res.push(f);
  }
  return res;
}

export async function filterDataTransferEntries(dt: DataTransfer, fnAllowed?: Function): Promise<FileWithPath[]> {
  let fileEntries = await getAllFileEntries(dt.items);
  // convert to File objects

  let res = [];
  for (let fe of fileEntries) {
    let path = fe.fullPath;
    if (fnAllowed && !fnAllowed(path)) {
      console.log(`${path} is not a supported file type`);
      continue;
    }
    let file = await new Promise((resolve, reject) => {
      // @ts-ignore
      fe.file(resolve, reject);
    });
    path = path.replace(/^\//, "");
    const f = new FileWithPath(file, path);
    res.push(f);
  }
  return res;
}

export function genRandomID(n: number): string {
  const SHORT_ID_SYMBOLS =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nShortSymbols = len(SHORT_ID_SYMBOLS);

  let res = "";
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * nShortSymbols);
    const c = SHORT_ID_SYMBOLS[idx];
    res = res + c;
  }
  return res;
}

export function splitMax(s: string, sep: string, max: number): string[] {
  throwIf(max === 0);
  let parts = s.split(sep);
  if (parts.length <= max) {
    return parts;
  }
  let restParts = parts.slice(max - 1);
  let restStr = restParts.join(sep);
  parts[max - 1] = restStr;
  return parts.slice(0, max);
}

export function setClipboard(s: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(s);
  }
}

export function clearClipboard() {
  setClipboard("");
}

export async function getClipboard(): Promise<string> {
  if (navigator.clipboard) {
    let s = await navigator.clipboard.readText();
    return s;
  }
  return "";
}

export async function appendClipboard(s: string) {
  let curr = await getClipboard();
  setClipboard(curr + s);
}

export function locationRemoveSearchParamsNoReload() {
  let path = window.location.pathname;
  window.history.replaceState({}, document.title, path);
}

export function requestFullScreen() {
  let el = document.documentElement;
  let rfs =
    el.requestFullscreen ||
    // @ts-ignore
    el.webkitRequestFullScreen ||
    // @ts-ignore
    el.mozRequestFullScreen ||
    // @ts-ignore
    el.msRequestFullscreen;
  rfs.call(el);
}

export function exitFullScreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
    // @ts-ignore
  } else if (document.mozCancelFullScreen) {
    // @ts-ignore
    document.mozCancelFullScreen();
    // @ts-ignore
  } else if (document.webkitCancelFullScreen) {
    // @ts-ignore
    document.webkitCancelFullScreen();
    // @ts-ignore
  } else if (document.msExitFullscreen) {
    // @ts-ignore
    document.msExitFullscreen();
  }
}

export function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

export function stripExt(name: string): string {
  let pos = name.lastIndexOf(".");
  if (pos > 0) {
    return name.slice(0, pos);
  }
  return name;
}

export function limit(n: number, min: number, max: number): number {
  if (n < min) {
    return min;
  }
  if (n > max) {
    return max;
  }
  return n;
}

export function arrayRemove(a: any[], el: any): any[] {
  const idx = a.indexOf(el);
  if (idx >= 0) {
    a.splice(idx, 1);
  }
  return a;
}

export function arrayRemoveFn(a: any[], el: any, cmpFn?: Function): any[] {
  let res = [];
  for (const el2 of a) {
    const eq = cmpFn(el, el2);
    if (!eq) {
      res.push(el2);
    }
  }
  return res;
}

export async function arrayRemoveFnAsync(a: any[], el: any, cmpFn?: Function): Promise<any[]> {
  let res = [];
  for (const el2 of a) {
    const eq = await cmpFn(el, el2);
    if (!eq) {
      res.push(el2);
    }
  }
  return res;
}

export function noOp() {
  // function that does nothing
}

export async function sha1(str) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-1", enc.encode(str));
  return Array.from(new Uint8Array(hash))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}

export function sleep(waitInMilliseconds: number): Promise<any> {
  return new Promise((resolve) => setTimeout(resolve, waitInMilliseconds));
}

export function internStringArray(a: string[], s: string): number {
  let n = len(a);
  for (let i = 0; i < n; i++) {
    if (a[i] === s) {
      return i;
    }
  }
  a.push(s);
  return n; // index of the newly appended key
}
