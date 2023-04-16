import { HttpSpacePrimitives } from "../spaces/http_space_primitives.js";
import { SpaceSync } from "../spaces/sync.js";
export function syncSyscalls(localSpace, system) {
  return {
    "sync.syncAll": async (_ctx, endpoint, snapshot) => {
      const { spaceSync } = setupSync(endpoint, snapshot);
      try {
        const operations = await spaceSync.syncFiles(
          SpaceSync.primaryConflictResolver
        );
        return {
          snapshot: Object.fromEntries(spaceSync.snapshot),
          operations,
        };
      } catch (e) {
        return {
          snapshot: Object.fromEntries(spaceSync.snapshot),
          operations: -1,
          error: e.message,
        };
      }
    },
    "sync.syncFile": async (_ctx, endpoint, snapshot, name) => {
      const { spaceSync, remoteSpace } = setupSync(endpoint, snapshot);
      try {
        const localHash = (await localSpace.getFileMeta(name)).lastModified;
        let remoteHash = void 0;
        try {
          remoteHash = (await remoteSpace.getFileMeta(name)).lastModified;
        } catch (e) {
          if (e.message.includes("File not found")) {
          } else {
            throw e;
          }
        }
        const operations = await spaceSync.syncFile(
          name,
          localHash,
          remoteHash,
          SpaceSync.primaryConflictResolver
        );
        return {
          snapshot: Object.fromEntries(spaceSync.snapshot),
          operations,
        };
      } catch (e) {
        return {
          snapshot: Object.fromEntries(spaceSync.snapshot),
          operations: -1,
          error: e.message,
        };
      }
    },
    "sync.check": async (_ctx, endpoint) => {
      const syncSpace = new HttpSpacePrimitives(
        endpoint.url,
        endpoint.user,
        endpoint.password
      );
      try {
        await syncSpace.fetchFileList();
      } catch (e) {
        console.error("Sync check failure", e.message);
        throw e;
      }
    },
  };
  function setupSync(endpoint, snapshot) {
    const remoteSpace = new HttpSpacePrimitives(
      endpoint.url,
      endpoint.user,
      endpoint.password,
      true
    );
    const syncStatusMap = new Map(Object.entries(snapshot));
    const spaceSync = new SpaceSync(localSpace, remoteSpace, syncStatusMap, {
      excludePrefixes: endpoint.excludePrefixes,
      logger: system.loadedPlugs.get("sync").sandbox,
    });
    return { spaceSync, remoteSpace };
  }
}
