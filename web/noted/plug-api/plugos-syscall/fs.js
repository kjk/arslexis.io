import { syscall } from "./syscall.js";
export class LocalFileSystem {
  constructor(root) {
    this.root = root;
  }
  readFile(path, encoding = "utf8") {
    return syscall("fs.readFile", `${this.root}/${path}`, encoding);
  }
  async getFileMeta(path) {
    return this.removeRootDir(
      await syscall("fs.getFileMeta", `${this.root}/${path}`)
    );
  }
  writeFile(path, text, encoding = "utf8") {
    return syscall("fs.writeFile", `${this.root}/${path}`, text, encoding);
  }
  deleteFile(path) {
    return syscall("fs.deleteFile", `${this.root}/${path}`);
  }
  async listFiles(dirName, recursive = false) {
    return (
      await syscall("fs.listFiles", `${this.root}/${dirName}`, recursive)
    ).map(this.removeRootDir.bind(this));
  }
  removeRootDir(fileMeta) {
    fileMeta.name = fileMeta.name.substring(this.root.length + 1);
    return fileMeta;
  }
}
