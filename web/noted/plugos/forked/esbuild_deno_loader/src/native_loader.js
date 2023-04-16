import * as deno from "./deno.js";

import { mediaTypeToLoader, transformRawIntoContent } from "./shared.js";

import { fromFileUrl } from "../deps.js";

export async function load(infoCache, url, options) {
  switch (url.protocol) {
    case "http:":
    case "https:":
    case "data:":
      return await loadFromCLI(infoCache, url, options);
    case "file:": {
      const res = await loadFromCLI(infoCache, url, options);
      res.watchFiles = [fromFileUrl(url.href)];
      return res;
    }
  }
  return null;
}
async function loadFromCLI(infoCache, specifier, options) {
  const specifierRaw = specifier.href;
  if (!infoCache.has(specifierRaw)) {
    const { modules, redirects } = await deno.info(specifier, {
      importMap: options.importMapURL?.href,
    });
    for (const module2 of modules) {
      infoCache.set(module2.specifier, module2);
    }
    for (const [specifier2, redirect] of Object.entries(redirects)) {
      const redirected = infoCache.get(redirect);
      if (!redirected) {
        throw new TypeError("Unreachable.");
      }
      infoCache.set(specifier2, redirected);
    }
  }
  const module = infoCache.get(specifierRaw);
  if (!module) {
    throw new TypeError("Unreachable.");
  }
  if (module.error) throw new Error(module.error);
  if (!module.local) throw new Error("Module not downloaded yet.");
  const mediaType = module.mediaType ?? "Unknown";
  const loader = mediaTypeToLoader(mediaType);
  const raw = await Deno.readFile(module.local);
  const contents = transformRawIntoContent(raw, mediaType);
  return { contents, loader };
}
