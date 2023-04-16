import { DB } from "../mod.js";
const commands = {
  create: (file) => {
    const db = new DB(file, { mode: "create" });
    db.query(`
      CREATE TABLE notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    db.close();
    console.log("Database created!");
  },
  record: (file, note) => {
    const db = new DB(file, { mode: "write" });
    db.query("INSERT INTO notes (note, created_at) VALUES (?, ?)", [
      note,
      new Date(),
    ]);
    db.close();
    console.log("Note recorded!");
  },
  delete: (file, noteId) => {
    const db = new DB(file, { mode: "write" });
    db.query("DELETE FROM notes WHERE id = ?", [noteId]);
    db.close();
    console.log("Note deleted!");
  },
  list: (file) => {
    const db = new DB(file, { mode: "read" });
    const query = db.prepareQuery(
      "SELECT id, note, created_at FROM notes ORDER BY created_at DESC"
    );
    for (const [id, note, createdAt] of query.iter()) {
      const date = new Date(createdAt);
      console.log(`Note #${id} (recorded ${date.toLocaleString()})
${note}
`);
    }
    query.finalize();
    db.close();
  },
};
const command =
  commands[Deno.args[0]] ??
  (() => console.error(`Unknown command '${Deno.args[0]}'.`));
await command(...Deno.args.slice(1));
