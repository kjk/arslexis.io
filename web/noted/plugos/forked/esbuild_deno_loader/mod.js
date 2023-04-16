import {
  resolveImportMap,
  resolveModuleSpecifier,
  toFileUrl
} from "./deps.ts";
import { load as nativeLoad } from "./src/native_loader.ts";
import { load as portableLoad } from "./src/portable_loader.ts";
export const DEFAULT_LOADER = typeof Deno.run === "function" ? "native" : "portable";
export function denoPlugin(options = {}) {
  const loader = options.loader ?? DEFAULT_LOADER;
  return {
    name: "deno",
    setup(build) {
      const infoCache = /* @__PURE__ */ new Map();
      let importMap = null;
      build.onStart(async function onStart() {
        if (options.importMapURL !== void 0) {
          const resp = await fetch(options.importMapURL.href);
          const txt = await resp.text();
          importMap = resolveImportMap(JSON.parse(txt), options.importMapURL);
        } else {
          importMap = null;
        }
      });
      build.onResolve(
        { filter: /.*/ },
        function onResolve(args) {
          const resolveDir = args.resolveDir ? `${toFileUrl(args.resolveDir).href}/` : "";
          const referrer = args.importer || resolveDir;
          let resolved;
          if (importMap !== null) {
            const res = resolveModuleSpecifier(
              args.path,
              importMap,
              new URL(referrer) || void 0
            );
            resolved = new URL(res);
          } else {
            resolved = new URL(args.path, referrer);
          }
          if (build.initialOptions.external) {
            for (const external of build.initialOptions.external) {
              if (resolved.href.startsWith(external)) {
                return { path: resolved.href, external: true };
              }
            }
          }
          const href = resolved.href;
          const loaderExts = Object.keys(build.initialOptions.loader || {});
          for (const ext of loaderExts) {
            if (href.endsWith(ext)) {
              console.log("Skipping", href);
              return {
                path: resolved.href.substring("file://".length)
              };
            }
          }
          return { path: resolved.href, namespace: "deno" };
        }
      );
      build.onLoad(
        { filter: /.*/ },
        function onLoad(args) {
          if (args.path.endsWith(".css")) {
            return Promise.resolve(null);
          }
          const url = new URL(args.path);
          switch (loader) {
            case "native":
              return nativeLoad(infoCache, url, options);
            case "portable":
              return portableLoad(url, options);
          }
        }
      );
    }
  };
}
