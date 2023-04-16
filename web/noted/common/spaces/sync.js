import { renderToText, replaceNodesMatching } from "../../plug-api/lib/tree.js";

import buildMarkdown from "../markdown_parser/parser.js";
import { parse } from "../markdown_parser/parse_tree.js";
class ConsoleLogger {
  log(_level, ...messageBits) {
    console.log(...messageBits);
  }
}
export class SpaceSync {
  constructor(primary, secondary, snapshot, options) {
    this.primary = primary;
    this.secondary = secondary;
    this.snapshot = snapshot;
    this.options = options;
    this.logger = options.logger || new ConsoleLogger();
    this.excludePrefixes = options.excludePrefixes || [];
  }
  async syncFiles(conflictResolver) {
    let operations = 0;
    this.logger.log("info", "Fetching snapshot from primary");
    const primaryAllPages = this.syncCandidates(
      await this.primary.fetchFileList()
    );
    this.logger.log("info", "Fetching snapshot from secondary");
    try {
      const secondaryAllPages = this.syncCandidates(
        await this.secondary.fetchFileList()
      );
      const primaryFileMap = new Map(
        primaryAllPages.map((m) => [m.name, m.lastModified])
      );
      const secondaryFileMap = new Map(
        secondaryAllPages.map((m) => [m.name, m.lastModified])
      );
      const allFilesToProcess = /* @__PURE__ */ new Set([
        ...this.snapshot.keys(),
        ...primaryFileMap.keys(),
        ...secondaryFileMap.keys(),
      ]);
      this.logger.log("info", "Iterating over all files");
      for (const name of allFilesToProcess) {
        try {
          operations += await this.syncFile(
            name,
            primaryFileMap.get(name),
            secondaryFileMap.get(name),
            conflictResolver
          );
        } catch (e) {
          this.logger.log("error", "Error syncing file", name, e.message);
        }
      }
    } catch (e) {
      this.logger.log("error", "General sync error:", e.message);
      throw e;
    }
    this.logger.log("info", "Sync complete, operations performed", operations);
    return operations;
  }
  async syncFile(name, primaryHash, secondaryHash, conflictResolver) {
    let operations = 0;
    for (const prefix of this.excludePrefixes) {
      if (name.startsWith(prefix)) {
        return operations;
      }
    }
    if (
      primaryHash !== void 0 &&
      secondaryHash === void 0 &&
      !this.snapshot.has(name)
    ) {
      this.logger.log(
        "info",
        "New file created on primary, copying to secondary",
        name
      );
      const { data } = await this.primary.readFile(name, "arraybuffer");
      const writtenMeta = await this.secondary.writeFile(
        name,
        "arraybuffer",
        data
      );
      this.snapshot.set(name, [primaryHash, writtenMeta.lastModified]);
      operations++;
    } else if (
      secondaryHash !== void 0 &&
      primaryHash === void 0 &&
      !this.snapshot.has(name)
    ) {
      this.logger.log(
        "info",
        "New file created on secondary, copying from secondary to primary",
        name
      );
      const { data } = await this.secondary.readFile(name, "arraybuffer");
      const writtenMeta = await this.primary.writeFile(
        name,
        "arraybuffer",
        data
      );
      this.snapshot.set(name, [writtenMeta.lastModified, secondaryHash]);
      operations++;
    } else if (
      primaryHash !== void 0 &&
      this.snapshot.has(name) &&
      secondaryHash === void 0
    ) {
      this.logger.log(
        "info",
        "File deleted on secondary, deleting from primary",
        name
      );
      await this.primary.deleteFile(name);
      this.snapshot.delete(name);
      operations++;
    } else if (
      secondaryHash !== void 0 &&
      this.snapshot.has(name) &&
      primaryHash === void 0
    ) {
      this.logger.log(
        "info",
        "File deleted on primary, deleting from secondary",
        name
      );
      await this.secondary.deleteFile(name);
      this.snapshot.delete(name);
      operations++;
    } else if (
      this.snapshot.has(name) &&
      primaryHash === void 0 &&
      secondaryHash === void 0
    ) {
      this.logger.log(
        "info",
        "File deleted on both ends, deleting from status",
        name
      );
      this.snapshot.delete(name);
      operations++;
    } else if (
      primaryHash !== void 0 &&
      secondaryHash !== void 0 &&
      this.snapshot.get(name) &&
      primaryHash !== this.snapshot.get(name)[0] &&
      secondaryHash === this.snapshot.get(name)[1]
    ) {
      this.logger.log(
        "info",
        "File changed on primary, copying to secondary",
        name
      );
      const { data } = await this.primary.readFile(name, "arraybuffer");
      const writtenMeta = await this.secondary.writeFile(
        name,
        "arraybuffer",
        data
      );
      this.snapshot.set(name, [primaryHash, writtenMeta.lastModified]);
      operations++;
    } else if (
      primaryHash !== void 0 &&
      secondaryHash !== void 0 &&
      this.snapshot.get(name) &&
      secondaryHash !== this.snapshot.get(name)[1] &&
      primaryHash === this.snapshot.get(name)[0]
    ) {
      this.logger.log(
        "info",
        "File has changed on secondary, but not primary: copy from secondary to primary",
        name
      );
      const { data } = await this.secondary.readFile(name, "arraybuffer");
      const writtenMeta = await this.primary.writeFile(
        name,
        "arraybuffer",
        data
      );
      this.snapshot.set(name, [writtenMeta.lastModified, secondaryHash]);
      operations++;
    } else if (
      (primaryHash !== void 0 &&
        secondaryHash !== void 0 &&
        !this.snapshot.has(name)) ||
      (primaryHash &&
        secondaryHash &&
        this.snapshot.get(name) &&
        secondaryHash !== this.snapshot.get(name)[1] &&
        primaryHash !== this.snapshot.get(name)[0])
    ) {
      this.logger.log(
        "info",
        "File changed on both ends, potential conflict",
        name
      );
      operations += await conflictResolver(
        name,
        this.snapshot,
        this.primary,
        this.secondary,
        this.logger
      );
    } else {
    }
    return operations;
  }
  static async primaryConflictResolver(
    name,
    snapshot,
    primary,
    secondary,
    logger
  ) {
    logger.log("info", "Starting conflict resolution for", name);
    const filePieces = name.split(".");
    const fileNameBase = filePieces.slice(0, -1).join(".");
    const fileNameExt = filePieces[filePieces.length - 1];
    const pageData1 = await primary.readFile(name, "arraybuffer");
    const pageData2 = await secondary.readFile(name, "arraybuffer");
    if (name.endsWith(".md")) {
      logger.log("info", "File is markdown, using smart conflict resolution");
      const pageText1 = removeDirectiveBody(
        new TextDecoder().decode(pageData1.data)
      );
      const pageText2 = removeDirectiveBody(
        new TextDecoder().decode(pageData2.data)
      );
      if (pageText1 === pageText2) {
        logger.log(
          "info",
          "Files are the same (eliminating the directive bodies), no conflict"
        );
        snapshot.set(name, [
          pageData1.meta.lastModified,
          pageData2.meta.lastModified,
        ]);
        return 0;
      }
    } else {
      let byteWiseMatch = true;
      const arrayBuffer1 = new Uint8Array(pageData1.data);
      const arrayBuffer2 = new Uint8Array(pageData2.data);
      if (arrayBuffer1.byteLength !== arrayBuffer2.byteLength) {
        byteWiseMatch = false;
      }
      if (byteWiseMatch) {
        for (let i = 0; i < arrayBuffer1.byteLength; i++) {
          if (arrayBuffer1[i] !== arrayBuffer2[i]) {
            byteWiseMatch = false;
            break;
          }
        }
        if (byteWiseMatch) {
          logger.log("info", "Files are the same, no conflict");
          snapshot.set(name, [
            pageData1.meta.lastModified,
            pageData2.meta.lastModified,
          ]);
          return 0;
        }
      }
    }
    const revisionFileName =
      filePieces.length === 1
        ? `${name}.conflicted.${pageData2.meta.lastModified}`
        : `${fileNameBase}.conflicted.${pageData2.meta.lastModified}.${fileNameExt}`;
    logger.log("info", "Going to create conflicting copy", revisionFileName);
    const localConflictMeta = await primary.writeFile(
      revisionFileName,
      "arraybuffer",
      pageData2.data
    );
    const remoteConflictMeta = await secondary.writeFile(
      revisionFileName,
      "arraybuffer",
      pageData2.data
    );
    snapshot.set(revisionFileName, [
      localConflictMeta.lastModified,
      remoteConflictMeta.lastModified,
    ]);
    const writeMeta = await secondary.writeFile(
      name,
      "arraybuffer",
      pageData1.data,
      true
    );
    snapshot.set(name, [pageData1.meta.lastModified, writeMeta.lastModified]);
    return 1;
  }
  syncCandidates(files) {
    return files.filter(
      (f) => !f.name.startsWith("_plug/") && f.lastModified > 0
    );
  }
}
const markdownLanguage = buildMarkdown([]);
export function removeDirectiveBody(text) {
  const tree = parse(markdownLanguage, text);
  replaceNodesMatching(tree, (node) => {
    if (node.type === "DirectiveBody") {
      return null;
    }
  });
  return renderToText(tree);
}
