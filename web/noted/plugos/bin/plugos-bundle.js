import { cacheDir, flags, path } from "../deps.js";
import { compile, esbuild, sandboxCompileModule } from "../compile.js";

import { YAML } from "../../common/deps.js";
import { bundleAssets } from "../asset_bundle/builder.js";

export async function bundle(manifestPath, options = {}) {
  const rootPath = path.dirname(manifestPath);
  const manifest = YAML.parse(await Deno.readTextFile(manifestPath));
  if (!manifest.name) {
    throw new Error(`Missing 'name' in ${manifestPath}`);
  }
  for (const [name, moduleSpec] of Object.entries(
    manifest.dependencies || {}
  )) {
    manifest.dependencies[name] = await sandboxCompileModule(moduleSpec);
  }
  const assetsBundle = await bundleAssets(
    path.resolve(rootPath),
    manifest.assets || []
  );
  manifest.assets = assetsBundle.toJSON();
  const plugCache = path.join(cacheDir(), "plugos");
  await Deno.mkdir(plugCache, { recursive: true });
  const imports = [];
  for (const manifestUrl of manifest.imports || []) {
    const cachedManifestPath = manifestUrl.replaceAll(/[^a-zA-Z0-9]/g, "_");
    try {
      if (options.reload) {
        throw new Error("Forced reload");
      }
      const cachedManifest = JSON.parse(
        await Deno.readTextFile(path.join(plugCache, cachedManifestPath))
      );
      imports.push(cachedManifest);
    } catch {
      console.log("Caching plug", manifestUrl, "to", plugCache);
      const cachedManifest = await (await fetch(manifestUrl)).json();
      await Deno.writeTextFile(
        path.join(plugCache, cachedManifestPath),
        JSON.stringify(cachedManifest)
      );
      imports.push(cachedManifest);
    }
  }
  for (const def of Object.values(manifest.functions || {})) {
    if (!def.path) {
      continue;
    }
    let jsFunctionName = "default",
      filePath = def.path;
    if (filePath.indexOf(":") !== -1) {
      [filePath, jsFunctionName] = filePath.split(":");
    }
    filePath = path.join(rootPath, filePath);
    def.code = await compile(filePath, jsFunctionName, {
      ...options,
      imports: [manifest, ...imports, ...(options.imports || [])],
    });
    delete def.path;
  }
  return manifest;
}
async function buildManifest(manifestPath, distPath, options = {}) {
  const generatedManifest = await bundle(manifestPath, options);
  const outFile =
    manifestPath.substring(
      0,
      manifestPath.length - path.extname(manifestPath).length
    ) + ".json";
  const outPath = path.join(distPath, path.basename(outFile));
  console.log("Emitting bundle to", outPath);
  await Deno.writeTextFile(outPath, JSON.stringify(generatedManifest, null, 2));
  return { generatedManifest, outPath };
}
export async function bundleRun(manifestFiles, dist, watch, options = {}) {
  let building = false;
  async function buildAll() {
    if (building) {
      return;
    }
    console.log("Building", manifestFiles);
    building = true;
    Deno.mkdirSync(dist, { recursive: true });
    const startTime = Date.now();
    await Promise.all(
      manifestFiles.map(async (plugManifestPath) => {
        const manifestPath = plugManifestPath;
        try {
          await buildManifest(manifestPath, dist, options);
        } catch (e) {
          console.error(`Error building ${manifestPath}:`, e);
        }
      })
    );
    console.log(`Done building plugs in ${Date.now() - startTime}ms`);
    building = false;
  }
  await buildAll();
  if (watch) {
    console.log("Watching for changes...");
    const watcher = Deno.watchFs(manifestFiles.map((p) => path.dirname(p)));
    for await (const event of watcher) {
      if (event.paths.length > 0) {
        if (event.paths[0].endsWith(".json")) {
          continue;
        }
      }
      console.log("Change detected, rebuilding...");
      buildAll();
    }
  }
}
if (import.meta.main) {
  const args = flags.parse(Deno.args, {
    boolean: ["debug", "watch", "reload", "info"],
    string: ["dist", "importmap"],
    alias: { w: "watch" },
  });
  if (args._.length === 0) {
    console.log(
      "Usage: plugos-bundle [--debug] [--reload] [--dist <path>] [--info] [--importmap import_map.json] [--exclude=package1,package2] <manifest.plug.yaml> <manifest2.plug.yaml> ..."
    );
    Deno.exit(1);
  }
  if (!args.dist) {
    args.dist = path.resolve(".");
  }
  await bundleRun(args._, args.dist, args.watch, {
    debug: args.debug,
    reload: args.reload,
    info: args.info,
    importMap: args.importmap
      ? new URL(args.importmap, `file://${Deno.cwd()}/`)
      : void 0,
  });
  esbuild.stop();
}
