import { Editor } from "./editor.tsx";
import { parseYamlSettings, safeRun } from "../common/util.ts";
import { Space } from "../common/spaces/space.ts";
import { HttpSpacePrimitives } from "../common/spaces/http_space_primitives.ts";
import { PlugSpacePrimitives } from "../common/spaces/plug_space_primitives.ts";
import { PageNamespaceHook } from "../common/hooks/page_namespace.ts";
import { System } from "../plugos/system.ts";
import { fulltextSyscalls } from "./syscalls/fulltext.ts";
import { indexerSyscalls } from "./syscalls/index.ts";
import { storeSyscalls } from "./syscalls/store.ts";
import { EventHook } from "../plugos/hooks/event.ts";
import { clientStoreSyscalls } from "./syscalls/clientStore.ts";
import { sandboxFetchSyscalls } from "./syscalls/fetch.ts";
safeRun(async () => {
  const httpPrimitives = new HttpSpacePrimitives("");
  let settingsPageText = "";
  try {
    settingsPageText = (await httpPrimitives.readFile("SETTINGS.md", "utf8")).data;
  } catch (e) {
    console.error("No settings page found", e.message);
  }
  const system = new System("client");
  const namespaceHook = new PageNamespaceHook();
  system.addHook(namespaceHook);
  const spacePrimitives = new PlugSpacePrimitives(
    httpPrimitives,
    namespaceHook,
    "client"
  );
  const serverSpace = new Space(spacePrimitives);
  serverSpace.watch();
  system.registerSyscalls(
    [],
    storeSyscalls(serverSpace),
    indexerSyscalls(serverSpace),
    clientStoreSyscalls(),
    fulltextSyscalls(serverSpace),
    sandboxFetchSyscalls(serverSpace)
  );
  console.log("Booting...");
  const settings = parseYamlSettings(settingsPageText);
  if (!settings.indexPage) {
    settings.indexPage = "index";
  }
  const eventHook = new EventHook();
  system.addHook(eventHook);
  const editor = new Editor(
    serverSpace,
    system,
    eventHook,
    document.getElementById("sb-root"),
    "",
    settings
  );
  window.editor = editor;
  await editor.init();
});
if (navigator.serviceWorker) {
  navigator.serviceWorker.register(new URL("/service_worker.js", location.href), {
    type: "module"
  }).then(() => {
    console.log("Service worker registered...");
  });
} else {
  console.log(
    "No launching service worker (not present, maybe because not running on localhost or over SSL)"
  );
}
