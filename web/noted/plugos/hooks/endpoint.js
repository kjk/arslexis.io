export class EndpointHook {
  constructor(app, prefix) {
    this.app = app;
    this.prefix = prefix;
  }
  apply(system) {
    this.app.use(async (ctx, next) => {
      const req = ctx.request;
      const requestPath = ctx.request.url.pathname;
      if (!requestPath.startsWith(this.prefix)) {
        return next();
      }
      console.log("Endpoint request", requestPath);
      for (const [plugName, plug] of system.loadedPlugs.entries()) {
        const manifest = plug.manifest;
        if (!manifest) {
          continue;
        }
        const functions = manifest.functions;
        console.log("Checking plug", plugName);
        const prefix = `${this.prefix}/${plugName}`;
        if (!requestPath.startsWith(prefix)) {
          continue;
        }
        for (const [name, functionDef] of Object.entries(functions)) {
          if (!functionDef.http) {
            continue;
          }
          const endpoints = Array.isArray(functionDef.http) ? functionDef.http : [functionDef.http];
          console.log(endpoints);
          for (const { path, method } of endpoints) {
            const prefixedPath = `${prefix}${path}`;
            if (prefixedPath === requestPath && ((method || "GET") === req.method || method === "ANY")) {
              try {
                const response = await plug.invoke(name, [
                  {
                    path: req.url.pathname,
                    method: req.method,
                    body: req.body(),
                    query: Object.fromEntries(
                      req.url.searchParams.entries()
                    ),
                    headers: Object.fromEntries(req.headers.entries())
                  }
                ]);
                if (response.headers) {
                  for (const [key, value] of Object.entries(
                    response.headers
                  )) {
                    ctx.response.headers.set(key, value);
                  }
                }
                ctx.response.status = response.status;
                ctx.response.body = response.body;
                console.log("Sent result");
                return;
              } catch (e) {
                console.error("Error executing function", e);
                ctx.response.status = 500;
                ctx.response.body = e.message;
                return;
              }
            }
          }
        }
      }
      next();
    });
  }
  validateManifest(manifest) {
    const errors = [];
    for (const functionDef of Object.values(manifest.functions)) {
      if (!functionDef.http) {
        continue;
      }
      const endpoints = Array.isArray(functionDef.http) ? functionDef.http : [functionDef.http];
      for (const { path, method } of endpoints) {
        if (!path) {
          errors.push("Path not defined for endpoint");
        }
        if (method && ["GET", "POST", "PUT", "DELETE", "ANY"].indexOf(method) === -1) {
          errors.push(
            `Invalid method ${method} for end point with with ${path}`
          );
        }
      }
    }
    return errors;
  }
}
