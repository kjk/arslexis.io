import { sandboxCompile, sandboxCompileModule } from "../compile.js";
import importMap from "../../import_map.json" assert { type: "json" };
import { base64EncodedDataUrl } from "../asset_bundle/base64.js";
export function esbuildSyscalls(imports) {
  return {
    "esbuild.compile": async (_ctx, filename, code, functionName) => {
      importMap.imports["$sb/"] = "https://deno.land/x/silverbullet/plug-api/";
      const importUrl = new URL(
        base64EncodedDataUrl(
          "application/json",
          new TextEncoder().encode(JSON.stringify(importMap))
        )
      );
      return await sandboxCompile(filename, code, functionName, {
        debug: true,
        imports,
        importMap: importUrl,
      });
    },
    "esbuild.compileModule": async (_ctx, moduleName) => {
      return await sandboxCompileModule(moduleName, {
        imports,
      });
    },
  };
}
