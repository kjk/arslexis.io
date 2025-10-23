// similar libraries: https://github.com/sindresorhus/file-type/blob/main/core.js#L67
// https://github.com/gabriel-vasile/mimetype/tree/master

import { len } from "./util";

type Size = {
  dx: number;
  dy: number;
};

type FileTypeInfo = {
  kind: string;
  dx?: number;
  dy?: number;
};

export const kindFilePDF = "pdf";
export const kindFilePS = "ps";
export const kindFileXps = "xps";
export const kindFileDjVu = "djvu";
export const kindFileChm = "chm";
export const kindFilePng = "png";
export const kindFileJpeg = "jpeg";
export const kindFileGif = "gif";
export const kindFileTiff = "tiff";
export const kindFileBmp = "bmp";
export const kindFileTga = "tga";
export const kindFileJxr = "jxr";
export const kindFileHdp = "hdp";
export const kindFileWdp = "wdp";
export const kindFileWebp = "webp";
export const kindFileJp2 = "jp2";
export const kindFileCbz = "cbz";
export const kindFileCbr = "cbr";
export const kindFileCb7 = "cb7";
export const kindFileCbt = "cbt";
export const kindFileZip = "zip";
export const kindFileRar = "rar";
export const kindFile7Z = "7z";
// export const kindFileTar = "fileTar";
// export const kindFileFb2 = "fileFb2";
// export const kindFileFb2z = "fileFb2z"; // fb2 but inside .zip file
// export const kindFileEpub = "fileEpub";
// TODO: introduce kindFileTealDoc?
export const kindFileMobi = "mobi";
export const kindFilePalmDoc = "palmdoc";
export const kindFileSvg = "svg";
export const kindFileHeic = "heic";
export const kindFileAvif = "avif";

// Note: splitting into fileSigTypes and fileSigs enables better type inference
const fileSigTypes = [
  kindFileRar,
  kindFileRar,
  kindFile7Z,
  kindFileZip,
  kindFileChm,
  kindFileMobi,
  kindFilePalmDoc,
  kindFilePalmDoc,
  kindFilePalmDoc,
  kindFilePng,
  kindFileJpeg,
  kindFileGif,
  kindFileGif,
  kindFileBmp,
  kindFileTiff,
  kindFileTiff,
  kindFileJxr,
  kindFileJxr,
  kindFileJp2,
  kindFileDjVu,
];

// TODO: add mime type
const fileSigs = [
  [0, "Rar!", 0x1a, 0x07, 0x00],
  [0, "Rar!", 0x1a, 0x07, 0x01, 0x00],
  [0, "7z", 0xbc, 0xaf, 0x27, 0x1c],
  [0, "PK", 0x03, 0x04],
  [0, "ITSF"],
  [0x3c, "BOOKMOBI"],
  [0x3c, "TEXtREAd"],
  [0x3c, "TEXtTlDc"],
  [0x3c, "DataPlkr"],
  [0, 0x89, "PNG", 0x0d, 0x0a, 0x1a, 0x0a],
  // TODO: be more specific, like:
  // case 'ffd8ffe0':
  //   case 'ffd8ffe1':
  //   case 'ffd8ffe2':
  //   case 'ffd8ffe3':
  //   case 'ffd8ffe8':
  [0, 0xff, 0xd8],
  [0, "GIF87a"],
  [0, "GIF89a"],
  [0, "BM"],
  [0, "MM", 0x00, 0x2a],
  [0, "II", 0x2a, 0x00],
  [0, "II", 0xbc, 0x01],
  [0, "II", 0xbc, 0x00],
  [0, 0, 0, 0, 0x0c, "jP  ", 0x0d, 0x0a, 0x87, 0x0a],
  [0, "AT&T"],
];

function startsWith(d: Uint8Array, off: number, str: string) {
  for (let c of str) {
    let n1 = c.charCodeAt(0);
    let n2 = d[off++];
    if (n1 !== n2) {
      return false;
    }
  }
  return true;
}

function rByte(d: Uint8Array, off: number) {
  if (off + 1 > len(d)) {
    return 0;
  }
  return d[off];
}

function rWordBE(d: Uint8Array, off: number) {
  if (off + 2 > len(d)) {
    return 0;
  }
  return (d[off] << 8) | d[off + 1];
}

function rDWordBE(d: Uint8Array, off: number) {
  if (off + 4 > len(d)) {
    return 0;
  }
  return (d[off] << 24) | (d[off + 1] << 16) | (d[off + 2] << 8) | d[off + 3];
}

function jpegSizeFromData(d: Uint8Array): Size | undefined {
  // find the last start of frame marker for non-differential Huffman/arithmetic coding
  let n = len(d);
  let idx = 2;
  for (; ;) {
    if (idx + 9 > n) {
      return undefined;
    }
    let b = rByte(d, idx);
    if (b !== 0xff) {
      return undefined;
    }
    b = rByte(d, idx + 1);
    if ((0xc0 <= b && b <= 0xc3) || (0xc9 <= b && b <= 0xcb)) {
      let dx = rWordBE(d, idx + 7);
      let dy = rWordBE(d, idx + 5);
      return { dx, dy };
    }
    let off = rWordBE(d, idx + 2);
    idx += off + 2;
  }
}

function pngSizeFromData(d: Uint8Array): Size | undefined {
  if (!startsWith(d, 12, "IHDR")) {
    return undefined;
  }
  let dx = rDWordBE(d, 16);
  let dy = rDWordBE(d, 20);
  return { dx, dy };
}

function matchesFileSig(d: Uint8Array, sig: any): boolean {
  let idx = sig[0];
  for (let i = 1; i < len(sig); i++) {
    let el = sig[i];
    if (typeof el === "number") {
      let n = d[idx++];
      if (el !== n) {
        return false;
      }
    } else if (typeof el === "string") {
      if (!startsWith(d, idx, el)) {
        return false;
      }
      idx += len(el);
    } else {
      throw new Error("invalid value in sig");
    }
  }
  return true;
}

export async function sniffFileType(dIn: Uint8Array | File | Blob): Promise<FileTypeInfo | undefined> {
  let d: Uint8Array;
  if (dIn instanceof Blob) {
    d = new Uint8Array(await dIn.slice(0, 4100).arrayBuffer());
  } else if (dIn instanceof Uint8Array) {
    d = dIn;
  } else {
    throw new Error("argument must be File, Blob or UInt8Array");
  }
  let idx = -1;
  for (let sig of fileSigs) {
    idx++;
    if (matchesFileSig(d, sig)) {
      let kind = fileSigTypes[idx];
      let size = {};
      if (kind === kindFilePng) {
        size = pngSizeFromData(d) || {};
      } else if (kind == kindFileJpeg) {
        size = jpegSizeFromData(d) || {};
      }
      return {
        kind,
        ...size,
      };
    }
  }
  return undefined;
}
