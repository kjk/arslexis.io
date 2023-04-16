import {
  bench,
  runBenchmarks
} from "https://deno.land/std@0.135.0/testing/bench.ts";
import { DB } from "./mod.ts";
if (Deno.args[0]) {
  try {
    await Deno.remove(Deno.args[0]);
  } catch (_) {
  }
}
const dbFile = Deno.args[0] || ":memory:";
const db = new DB(dbFile);
db.query(
  "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, balance INTEGER)"
);
const names = "Deno Land Peter Parker Clark Kent Robert Parr".split(" ");
bench({
  name: "insert 10 000 (named)",
  runs: 100,
  func: (b) => {
    b.start();
    const query = db.prepareQuery(
      "INSERT INTO users (name, balance) VALUES (:name, :balance)"
    );
    db.query("begin");
    for (let i = 0; i < 1e4; i++) {
      query.execute({ name: names[i % names.length], balance: i });
    }
    db.query("commit");
    b.stop();
  }
});
bench({
  name: "insert 10 000 (positional)",
  runs: 100,
  func: (b) => {
    b.start();
    const query = db.prepareQuery(
      "INSERT INTO users (name, balance) VALUES (?, ?)"
    );
    db.query("begin");
    for (let i = 0; i < 1e4; i++) {
      query.execute([names[i % names.length], i]);
    }
    db.query("commit");
    b.stop();
  }
});
bench({
  name: "select 10 000 (select all)",
  runs: 100,
  func: (b) => {
    b.start();
    db.query(
      "SELECT name, balance FROM users LIMIT 10000"
    );
    b.stop();
  }
});
bench({
  name: "select 10 000 (select first)",
  runs: 100,
  func: (b) => {
    b.start();
    const query = db.prepareQuery(
      "SELECT name, balance FROM users WHERE id = ?"
    );
    for (let id = 1; id <= 1e4; id++) {
      query.first([id]);
    }
    b.stop();
  }
});
runBenchmarks();
