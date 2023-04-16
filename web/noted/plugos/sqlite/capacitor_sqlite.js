import { Capacitor } from "../../mobile/deps.js";
import { CapacitorSQLite } from "../deps.js";
export class CapacitorDb {
  constructor(name) {
    this.name = name;
  }
  async init() {
    await CapacitorSQLite.createConnection({
      database: this.name,
    });
    await CapacitorSQLite.open({
      database: this.name,
    });
  }
  async query(sql, ...args) {
    const result = await CapacitorSQLite.query({
      statement: sql,
      database: this.name,
      values: args,
    });
    if (Capacitor.getPlatform() === "ios") {
      return result.values.slice(1);
    }
    return result.values;
  }
  async execute(sql, ...args) {
    return (
      await CapacitorSQLite.run({
        statement: sql,
        database: this.name,
        values: args,
      })
    ).changes.changes;
  }
}
