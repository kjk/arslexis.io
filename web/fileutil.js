// not
const binaryExts = [
  ".bmp",
  ".ico",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
  ".jfif",
  ".tiff",
  ".xd",
  ".a",
  ".xz",
  ".gz",
  ".tar",
  ".zip",
  ".rar",
  ".7z",
  ".cbz",
  ".cbr",
  ".cb7",
  ".exe",
  ".dll",
  ".pdb",
  ".lib",
  ".ttf",
  ".otf",
  ".afm",
];

export function isBinary(path) {
  if (path.includes(".git/")) {
    return true;
  }
  let ext = getFileExt(path);
  return binaryExts.includes(ext);
}

/**
 * @param {Blob} f
 * @returns {Promise<number>}
 */
export async function lineCount(f) {
  if (f.size === 0) {
    return 0;
  }
  let ab = await f.arrayBuffer();
  let a = new Uint8Array(ab);
  let nLines = 0;
  // if last character is not newline, we must add +1 to line count
  let toAdd = 0;
  for (let b of a) {
    // line endings are:
    // CR (13) LF (10) : windows
    // LF (10) : unix
    // CR (13) : mac
    // mac is very rare so we just count 10 as they count
    // windows and unix lines
    if (b === 10) {
      toAdd = 0;
      nLines++;
    } else {
      toAdd = 1;
    }
  }
  return nLines + toAdd;
}

/**
 * "foo.TXT" => ".txt"
 * "foo" => ""
 * @param {string} fileName
 * @returns {string}
 */
export function getFileExt(fileName) {
  let parts = fileName.split(".");
  let n = parts.length;
  if (n > 1) {
    return "." + parts[n - 1].toLowerCase();
  }
  return "";
}
/**
 * foo.txt => foo-1.txt, foo-1.txt => foo-2.txt etc.
 * @param {string} s
 * @returns {string}
 */
export function genNextUniqueFileName(s) {
  /**
   * @param {string} s
   * @returns {number|null}
   */
  function toNumberOrNull(s) {
    const n = parseInt(s);
    const ns = `${n}`;
    if (s === ns) {
      return n;
    }
    return null;
  }

  let ext = "";
  let parts = s.split(".");
  let n = parts.length;
  if (n > 1) {
    ext = "." + parts[n - 1];
    s = parts.slice(0, n - 1).join(".");
  }
  parts = s.split("-");
  n = parts.length;
  if (n === 1) {
    return parts[0] + "-1" + ext;
  }
  const currSuffix = toNumberOrNull(parts[n - 1]);
  if (currSuffix === null) {
    return s + "-1" + ext;
  }
  const newSuffix = `${currSuffix + 1}`;
  parts[n - 1] = newSuffix;
  s = parts.join("-");
  return s + ext;
}

export async function verifyHandlePermission(fileHandle, readWrite) {
  const options = {};
  if (readWrite) {
    options.mode = "readwrite";
  }
  // Check if permission was already granted. If so, return true.
  if ((await fileHandle.queryPermission(options)) === "granted") {
    return true;
  }
  // Request permission. If the user grants permission, return true.
  if ((await fileHandle.requestPermission(options)) === "granted") {
    return true;
  }
  // The user didn't grant permission, so return false.
  return false;
}

/**
 * @returns {boolean}
 */
export function isIFrame() {
  let isIFrame = false;
  try {
    // in iframe, those are different
    isIFrame = window.self !== window.top;
  } catch {
    // do nothing
  }
  return isIFrame;
}

/**
 * @returns {boolean}
 */
export function supportsFileSystem() {
  return "showDirectoryPicker" in window && !isIFrame();
}
