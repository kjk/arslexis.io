import { Cron } from "https://cdn.jsdelivr.net/gh/hexagon/croner@4/src/croner.js";
import { safeRun } from "../util.js";
export class CronHook {
  constructor(system) {
    this.system = system;
    this.tasks = [];
  }
  apply(system) {
    this.system = system;
    system.on({
      plugLoaded: () => {
        this.reloadCrons();
      },
      plugUnloaded: () => {
        this.reloadCrons();
      },
    });
    this.reloadCrons();
  }
  stop() {
    this.tasks.forEach((task) => task.stop());
    this.tasks = [];
  }
  reloadCrons() {
    this.stop();
    for (const plug of this.system.loadedPlugs.values()) {
      if (!plug.manifest) {
        continue;
      }
      for (const [name, functionDef] of Object.entries(
        plug.manifest.functions
      )) {
        if (!functionDef.cron) {
          continue;
        }
        const crons = Array.isArray(functionDef.cron)
          ? functionDef.cron
          : [functionDef.cron];
        for (const cronDef of crons) {
          this.tasks.push(
            new Cron(cronDef, () => {
              safeRun(async () => {
                try {
                  await plug.invoke(name, [cronDef]);
                } catch (e) {
                  console.error("Execution of cron function failed", e);
                }
              });
            })
          );
        }
      }
    }
  }
  validateManifest(manifest) {
    const errors = [];
    for (const functionDef of Object.values(manifest.functions)) {
      if (!functionDef.cron) {
        continue;
      }
      const crons = Array.isArray(functionDef.cron)
        ? functionDef.cron
        : [functionDef.cron];
      for (const _cronDef of crons) {
      }
    }
    return errors;
  }
}
