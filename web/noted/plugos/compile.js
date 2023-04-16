import * as esbuildWasm from "https://deno.land/x/esbuild@v0.14.54/wasm.js";
import * as esbuildNative from "https://deno.land/x/esbuild@v0.14.54/mod.js";
export const esbuild = Deno.run === void 0 ? esbuildWasm : esbuildNative;
import { path } from "./deps.ts";
import { denoPlugin } from "./forked/esbuild_deno_loader/mod.ts";
import { patchDenoLibJS } from "./hack.ts";
function esBuildExternals(imports) {
  if (!imports) {
    return [];
  }
  const externals = [];
  for (const manifest of imports) {
    for (const dep of Object.keys(manifest.dependencies || {})) {
      if (!externals.includes(dep)) {
        externals.push(dep);
      }
    }
  }
  return externals;
}
export async function compile(filePath, functionName = void 0, options = {}) {
  const outFile = await Deno.makeTempFile({ suffix: ".js" });
  let inFile = filePath;
  if (functionName) {
    inFile = await Deno.makeTempFile({ suffix: ".ts" });
    await Deno.writeTextFile(
      inFile,
      `import {${functionName}} from "file://${path.resolve(filePath).replaceAll(
        "\\",
        "\\\\"
      )}";export default ${functionName};`
    );
  }
  try {
    const result = await esbuild.build({
      entryPoints: [path.basename(inFile)],
      bundle: true,
      format: "iife",
      globalName: "mod",
      platform: "browser",
      sourcemap: false,
      minify: !options.debug,
      outfile: outFile,
      metafile: options.info,
      external: esBuildExternals(options.imports),
      treeShaking: true,
      plugins: [
        denoPlugin({
          importMapURL: options.importMap || new URL("./../import_map.json", import.meta.url),
          loader: "native"
        })
      ],
      absWorkingDir: path.resolve(path.dirname(inFile))
    });
    if (options.info) {
      const text = await esbuild.analyzeMetafile(result.metafile);
      console.log("Bundle info for", functionName, text);
    }
    let jsCode = await Deno.readTextFile(outFile);
    jsCode = patchDenoLibJS(jsCode);
    await Deno.remove(outFile);
    return `(() => { ${jsCode} return mod;})()`;
  } finally {
    if (inFile !== filePath) {
      await Deno.remove(inFile);
    }
  }
}
export async function compileModule(cwd, moduleName, options = {}) {
  const inFile = path.resolve(cwd, "_in.ts");
  await Deno.writeTextFile(inFile, `export * from "${moduleName}";`);
  const code = await compile(inFile, void 0, options);
  await Deno.remove(inFile);
  return code;
}
export async function sandboxCompile(filename, code, functionName, options = {}) {
  const tmpDir = await Deno.makeTempDir();
  await Deno.writeTextFile(`${tmpDir}/${filename}`, code);
  const jsCode = await compile(
    `${tmpDir}/${filename}`,
    functionName,
    options
  );
  await Deno.remove(tmpDir, { recursive: true });
  return jsCode;
}
export async function sandboxCompileModule(moduleUrl, options = {}) {
  await Deno.writeTextFile(
    "_mod.ts",
    `module.exports = require("${moduleUrl}");`
  );
  const code = await compile("_mod.ts", void 0, options);
  await Deno.remove("_mod.ts");
  return code;
}
