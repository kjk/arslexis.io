import { removeDirectiveBody, SpaceSync } from "./sync.ts";
import { DiskSpacePrimitives } from "./disk_space_primitives.ts";
import { assertEquals } from "../../test_deps.ts";
Deno.test("Test store", async () => {
  const primaryPath = await Deno.makeTempDir();
  const secondaryPath = await Deno.makeTempDir();
  console.log("Primary", primaryPath);
  console.log("Secondary", secondaryPath);
  const primary = new DiskSpacePrimitives(primaryPath);
  const secondary = new DiskSpacePrimitives(secondaryPath);
  const statusMap = /* @__PURE__ */ new Map();
  const sync = new SpaceSync(primary, secondary, statusMap, {});
  await primary.writeFile("index", "utf8", "Hello");
  assertEquals((await secondary.fetchFileList()).length, 0);
  console.log("Initial sync ops", await doSync());
  assertEquals((await secondary.fetchFileList()).length, 1);
  assertEquals((await secondary.readFile("index", "utf8")).data, "Hello");
  assertEquals(await doSync(), 0);
  await secondary.writeFile("index", "utf8", "Hello!!");
  await secondary.writeFile("test", "utf8", "Test page");
  await doSync();
  assertEquals((await primary.fetchFileList()).length, 2);
  assertEquals((await secondary.fetchFileList()).length, 2);
  assertEquals((await primary.readFile("index", "utf8")).data, "Hello!!");
  await primary.writeFile("index", "utf8", "1");
  await primary.writeFile("index2", "utf8", "2");
  await secondary.writeFile("index3", "utf8", "3");
  await secondary.writeFile("index4", "utf8", "4");
  await doSync();
  assertEquals((await primary.fetchFileList()).length, 5);
  assertEquals((await secondary.fetchFileList()).length, 5);
  assertEquals(await doSync(), 0);
  console.log("Deleting pages");
  await primary.deleteFile("index");
  await primary.deleteFile("index3");
  await doSync();
  assertEquals((await primary.fetchFileList()).length, 3);
  assertEquals((await secondary.fetchFileList()).length, 3);
  assertEquals(await doSync(), 0);
  await secondary.deleteFile("index4");
  await primary.deleteFile("index2");
  await doSync();
  assertEquals((await primary.fetchFileList()).length, 1);
  assertEquals((await secondary.fetchFileList()).length, 1);
  assertEquals(await doSync(), 0);
  await secondary.writeFile("index", "utf8", "I'm back");
  await doSync();
  assertEquals((await primary.readFile("index", "utf8")).data, "I'm back");
  console.log("Introducing a conflict now");
  await primary.writeFile("index", "utf8", "Hello 1");
  await secondary.writeFile("index", "utf8", "Hello 2");
  await doSync();
  await doSync();
  assertEquals((await primary.readFile("index", "utf8")).data, "Hello 1");
  assertEquals((await secondary.readFile("index", "utf8")).data, "Hello 1");
  assertEquals((await primary.fetchFileList()).length, 3);
  assertEquals((await secondary.fetchFileList()).length, 3);
  await primary.writeFile("index", "utf8", "Hello 1");
  await secondary.writeFile("index", "utf8", "Hello 1");
  await primary.writeFile(
    "index.md",
    "utf8",
    "Hello\n<!-- #query page -->\nHello 1\n<!-- /query -->"
  );
  await secondary.writeFile(
    "index.md",
    "utf8",
    "Hello\n<!-- #query page -->\nHello 2\n<!-- /query -->"
  );
  await doSync();
  await doSync();
  assertEquals((await primary.fetchFileList()).length, 4);
  console.log("Bringing a third device in the mix");
  const ternaryPath = await Deno.makeTempDir();
  console.log("Ternary", ternaryPath);
  const ternary = new DiskSpacePrimitives(ternaryPath);
  const sync2 = new SpaceSync(
    secondary,
    ternary,
    /* @__PURE__ */ new Map(),
    {}
  );
  console.log(
    "N ops",
    await sync2.syncFiles(SpaceSync.primaryConflictResolver)
  );
  await sleep(2);
  assertEquals(await sync2.syncFiles(SpaceSync.primaryConflictResolver), 0);
  const quaternaryPath = await Deno.makeTempDir();
  const quaternary = new DiskSpacePrimitives(quaternaryPath);
  const sync3 = new SpaceSync(
    secondary,
    quaternary,
    /* @__PURE__ */ new Map(),
    {
      excludePrefixes: ["index"]
    }
  );
  const selectingOps = await sync3.syncFiles(SpaceSync.primaryConflictResolver);
  assertEquals(selectingOps, 1);
  await Deno.remove(primaryPath, { recursive: true });
  await Deno.remove(secondaryPath, { recursive: true });
  await Deno.remove(ternaryPath, { recursive: true });
  await Deno.remove(quaternaryPath, { recursive: true });
  async function doSync() {
    await sleep();
    const r = await sync.syncFiles(
      SpaceSync.primaryConflictResolver
    );
    await sleep();
    return r;
  }
});
function sleep(ms = 10) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
Deno.test("Remove directive bodies", () => {
  assertEquals(
    removeDirectiveBody(`<!-- #query page -->
This is a body
bla bla bla
<!-- /query -->
Hello
<!-- #include [[test]] -->
This is a body
<!-- /include -->
`),
    `<!-- #query page -->
<!-- /query -->
Hello
<!-- #include [[test]] -->
<!-- /include -->
`
  );
});
