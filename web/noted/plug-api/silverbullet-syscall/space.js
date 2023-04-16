import { syscall } from "./syscall.js";
export class SpaceFileSystem {
  listPages(unfiltered = false) {
    return syscall("space.listPages", unfiltered);
  }
  getPageMeta(name) {
    return syscall("space.getPageMeta", name);
  }
  readPage(name) {
    return syscall("space.readPage", name);
  }
  writePage(name, text) {
    return syscall("space.writePage", name, text);
  }
  deletePage(name) {
    return syscall("space.deletePage", name);
  }
  listPlugs() {
    return syscall("space.listPlugs");
  }
  listAttachments() {
    return syscall("space.listAttachments");
  }
  getAttachmentMeta(name) {
    return syscall("space.getAttachmentMeta", name);
  }
  readAttachment(name) {
    return syscall("space.readAttachment", name);
  }
  writeAttachment(name, encoding, data) {
    return syscall("space.writeAttachment", name, encoding, data);
  }
  deleteAttachment(name) {
    return syscall("space.deleteAttachment", name);
  }
  readFile(path, encoding) {
    return syscall("space.readFile", path, encoding);
  }
  getFileMeta(path) {
    return syscall("space.getFileMeta", path);
  }
  writeFile(path, text, encoding) {
    return syscall("space.writeFile", path, text, encoding);
  }
  deleteFile(path) {
    return syscall("space.deleteFile", path);
  }
  listFiles(path) {
    return syscall("space.listFiles", path);
  }
}
export default new SpaceFileSystem();
