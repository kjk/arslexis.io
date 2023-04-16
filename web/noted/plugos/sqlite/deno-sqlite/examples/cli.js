import { readLines, writeAll } from "https://deno.land/std@0.134.0/io/mod.js";

import AsciiTable from "https://deno.land/x/ascii_table@v0.1.0/mod.js";
import { DB } from "../mod.js";
const db = new DB(Deno.args[0] ?? void 0);
async function print(str) {
  const enc = new TextEncoder();
  await writeAll(Deno.stdout, enc.encode(str));
}
async function prompt() {
  await print("sqlite> ");
}
const tablesQuery = db.prepareQuery(
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
);
const commands = {
  tables: async () => {
    for (const [name] of tablesQuery.iter()) {
      await print(`${name}
`);
    }
  },
  quit: async () => {
    await print("\n");
    Deno.exit(0);
  },
  help: async () => {
    await print(
      "Type an SQL query or run a command.\nThe following commands are available:\n"
    );
    for (const key in commands) {
      await print(`.${key}
`);
    }
  },
};
await prompt();
for await (const cmd of readLines(Deno.stdin)) {
  if (cmd[0] === ".") {
    const action =
      commands[cmd.slice(1)] ??
      (() => print("Unrecognized command, try .help\n"));
    await action();
  } else {
    try {
      const query = db.prepareQuery(cmd);
      const rows = query.all();
      const cols = query.columns();
      query.finalize();
      if (cols.length) {
        const table = new AsciiTable();
        table.setHeading("#", ...cols.map(({ name }) => name));
        for (const [idx, row] of rows.entries()) {
          table.addRow(idx + 1, ...row);
        }
        print(table.toString());
        print("\n");
      } else {
        print(`Executed query: ${db.changes} changes
`);
      }
    } catch (err) {
      console.error(err);
    }
  }
  await prompt();
}
