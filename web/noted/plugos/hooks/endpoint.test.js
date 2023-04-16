import { Application } from "../../server/deps.js";
import { EndpointHook } from "./endpoint.js";
import { System } from "../system.js";
import { assertEquals } from "../../test_deps.js";
import { createSandbox } from "../environments/deno_sandbox.js";
Deno.test("Run a plugos endpoint server", async () => {
  const system = new System("server");
  await system.load(
    {
      name: "test",
      functions: {
        testhandler: {
          http: {
            path: "/",
          },
          code: `(() => {
          return {
            default: (req) => {
              console.log("Req", req);
              return {status: 200, body: [1, 2, 3], headers: {"Content-type": "application/json"}};
            }
          };
        })()`,
        },
      },
    },
    createSandbox
  );
  const app = new Application();
  const port = 3123;
  system.addHook(new EndpointHook(app, "/_"));
  const controller = new AbortController();
  app.listen({ port, signal: controller.signal });
  const res = await fetch(`http://localhost:${port}/_/test/?name=Pete`);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Content-type"), "application/json");
  assertEquals(await res.json(), [1, 2, 3]);
  console.log("Aborting");
  controller.abort();
  await system.unloadAll();
});
