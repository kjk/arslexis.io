import { OpenFlags, Status, Values } from "./constants.js";

import { PreparedQuery } from "./query.js";
import { SqliteError } from "./error.js";
import { instantiate } from "../build/sqlite.js";
import { setStr } from "./wasm.js";
export class DB {
  constructor(path = ":memory:", options = {}) {
    this._wasm = instantiate().exports;
    this._open = false;
    this._statements = /* @__PURE__ */ new Set();
    this._transactionDepth = 0;
    let flags = 0;
    switch (options.mode) {
      case "read":
        flags = OpenFlags.ReadOnly;
        break;
      case "write":
        flags = OpenFlags.ReadWrite;
        break;
      case "create":
      default:
        flags = OpenFlags.ReadWrite | OpenFlags.Create;
        break;
    }
    if (options.memory === true) {
      flags |= OpenFlags.Memory;
    }
    if (options.uri === true) {
      flags |= OpenFlags.Uri;
    }
    const status = setStr(this._wasm, path, (ptr) =>
      this._wasm.open(ptr, flags)
    );
    if (status !== Status.SqliteOk) {
      throw new SqliteError(this._wasm, status);
    }
    this._open = true;
  }
  query(sql, params) {
    const query = this.prepareQuery(sql);
    try {
      const rows = query.all(params);
      query.finalize();
      return rows;
    } catch (err) {
      query.finalize();
      throw err;
    }
  }
  queryEntries(sql, params) {
    const query = this.prepareQuery(sql);
    try {
      const rows = query.allEntries(params);
      query.finalize();
      return rows;
    } catch (err) {
      query.finalize();
      throw err;
    }
  }
  prepareQuery(sql) {
    if (!this._open) {
      throw new SqliteError("Database was closed.");
    }
    const stmt = setStr(this._wasm, sql, (ptr) => this._wasm.prepare(ptr));
    if (stmt === Values.Null) {
      throw new SqliteError(this._wasm);
    }
    this._statements.add(stmt);
    return new PreparedQuery(this._wasm, stmt, this._statements);
  }
  execute(sql) {
    const status = setStr(this._wasm, sql, (ptr) => this._wasm.exec(ptr));
    if (status !== Status.SqliteOk) {
      throw new SqliteError(this._wasm, status);
    }
  }
  transaction(closure) {
    this._transactionDepth += 1;
    this.query(`SAVEPOINT _deno_sqlite_sp_${this._transactionDepth}`);
    let value;
    try {
      value = closure();
    } catch (err) {
      this.query(`ROLLBACK TO _deno_sqlite_sp_${this._transactionDepth}`);
      this._transactionDepth -= 1;
      throw err;
    }
    this.query(`RELEASE _deno_sqlite_sp_${this._transactionDepth}`);
    this._transactionDepth -= 1;
    return value;
  }
  close(force = false) {
    if (!this._open) {
      return;
    }
    if (force) {
      for (const stmt of this._statements) {
        if (this._wasm.finalize(stmt) !== Status.SqliteOk) {
          throw new SqliteError(this._wasm);
        }
      }
    }
    if (this._wasm.close() !== Status.SqliteOk) {
      throw new SqliteError(this._wasm);
    }
    this._open = false;
  }
  get lastInsertRowId() {
    return this._wasm.last_insert_rowid();
  }
  get changes() {
    return this._wasm.changes();
  }
  get totalChanges() {
    return this._wasm.total_changes();
  }
}
