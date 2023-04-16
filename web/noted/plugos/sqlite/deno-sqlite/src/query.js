import { Status, Types, Values } from "./constants.js";
import { getStr, setArr, setStr } from "./wasm.js";

import { SqliteError } from "./error.js";
export class PreparedQuery {
  constructor(wasm, stmt, openStatements) {
    this._wasm = wasm;
    this._stmt = stmt;
    this._openStatements = openStatements;
    this._status = Status.Unknown;
    this._iterKv = false;
    this._finalized = false;
  }
  startQuery(params) {
    if (this._finalized) {
      throw new SqliteError("Query is finalized.");
    }
    this._wasm.reset(this._stmt);
    this._wasm.clear_bindings(this._stmt);
    let parameters = [];
    if (Array.isArray(params)) {
      parameters = params;
    } else if (typeof params === "object") {
      for (const key of Object.keys(params)) {
        let name = key;
        if (name[0] !== ":" && name[0] !== "@" && name[0] !== "$") {
          name = `:${name}`;
        }
        const idx = setStr(this._wasm, name, (ptr) =>
          this._wasm.bind_parameter_index(this._stmt, ptr)
        );
        if (idx === Values.Error) {
          throw new SqliteError(`No parameter named '${name}'.`);
        }
        parameters[idx - 1] = params[key];
      }
    }
    for (let i = 0; i < parameters.length; i++) {
      let value = parameters[i];
      let status;
      switch (typeof value) {
        case "boolean":
          value = value ? 1 : 0;
        case "number":
          if (Number.isSafeInteger(value)) {
            status = this._wasm.bind_int(this._stmt, i + 1, value);
          } else {
            status = this._wasm.bind_double(this._stmt, i + 1, value);
          }
          break;
        case "bigint":
          if (value > 9223372036854775807n || value < -9223372036854775808n) {
            throw new SqliteError(
              `BigInt value ${value} overflows 64 bit integer.`
            );
          } else {
            const posVal = value >= 0n ? value : -value;
            const sign = value >= 0n ? 1 : -1;
            const upper = Number(BigInt.asUintN(32, posVal >> 32n));
            const lower = Number(BigInt.asUintN(32, posVal));
            status = this._wasm.bind_big_int(
              this._stmt,
              i + 1,
              sign,
              upper,
              lower
            );
          }
          break;
        case "string":
          status = setStr(this._wasm, value, (ptr) =>
            this._wasm.bind_text(this._stmt, i + 1, ptr)
          );
          break;
        default:
          if (value instanceof Date) {
            status = setStr(this._wasm, value.toISOString(), (ptr) =>
              this._wasm.bind_text(this._stmt, i + 1, ptr)
            );
          } else if (value instanceof Uint8Array) {
            const size = value.length;
            status = setArr(this._wasm, value, (ptr) =>
              this._wasm.bind_blob(this._stmt, i + 1, ptr, size)
            );
          } else if (value === null || value === void 0) {
            status = this._wasm.bind_null(this._stmt, i + 1);
          } else {
            throw new SqliteError(`Can not bind ${typeof value}.`);
          }
          break;
      }
      if (status !== Status.SqliteOk) {
        throw new SqliteError(this._wasm, status);
      }
    }
  }
  getQueryRow() {
    if (this._finalized) {
      throw new SqliteError("Query is finalized.");
    }
    const columnCount = this._wasm.column_count(this._stmt);
    const row = [];
    for (let i = 0; i < columnCount; i++) {
      switch (this._wasm.column_type(this._stmt, i)) {
        case Types.Integer:
          row.push(this._wasm.column_int(this._stmt, i));
          break;
        case Types.Float:
          row.push(this._wasm.column_double(this._stmt, i));
          break;
        case Types.Text:
          row.push(getStr(this._wasm, this._wasm.column_text(this._stmt, i)));
          break;
        case Types.Blob: {
          const ptr = this._wasm.column_blob(this._stmt, i);
          if (ptr === 0) {
            row.push(null);
          } else {
            const length = this._wasm.column_bytes(this._stmt, i);
            row.push(
              new Uint8Array(this._wasm.memory.buffer, ptr, length).slice()
            );
          }
          break;
        }
        case Types.BigInteger: {
          const ptr = this._wasm.column_text(this._stmt, i);
          row.push(BigInt(getStr(this._wasm, ptr)));
          break;
        }
        default:
          row.push(null);
          break;
      }
    }
    return row;
  }
  makeRowObject(row) {
    if (this._rowKeys == null) {
      const rowCount = this._wasm.column_count(this._stmt);
      this._rowKeys = [];
      for (let i = 0; i < rowCount; i++) {
        this._rowKeys.push(
          getStr(this._wasm, this._wasm.column_name(this._stmt, i))
        );
      }
    }
    const obj = row.reduce((obj2, val, idx) => {
      obj2[this._rowKeys[idx]] = val;
      return obj2;
    }, {});
    return obj;
  }
  iter(params) {
    this.startQuery(params);
    this._status = this._wasm.step(this._stmt);
    if (
      this._status !== Status.SqliteRow &&
      this._status !== Status.SqliteDone
    ) {
      throw new SqliteError(this._wasm, this._status);
    }
    this._iterKv = false;
    return this;
  }
  iterEntries(params) {
    this.iter(params);
    this._iterKv = true;
    return this;
  }
  [Symbol.iterator]() {
    return this;
  }
  next() {
    if (this._status === Status.SqliteRow) {
      const value = this.getQueryRow();
      this._status = this._wasm.step(this._stmt);
      if (this._iterKv) {
        return { value: this.makeRowObject(value), done: false };
      } else {
        return { value, done: false };
      }
    } else if (this._status === Status.SqliteDone) {
      return { value: null, done: true };
    } else {
      throw new SqliteError(this._wasm, this._status);
    }
  }
  all(params) {
    this.startQuery(params);
    const rows = [];
    this._status = this._wasm.step(this._stmt);
    while (this._status === Status.SqliteRow) {
      rows.push(this.getQueryRow());
      this._status = this._wasm.step(this._stmt);
    }
    if (this._status !== Status.SqliteDone) {
      throw new SqliteError(this._wasm, this._status);
    }
    return rows;
  }
  allEntries(params) {
    return this.all(params).map((row) => this.makeRowObject(row));
  }
  first(params) {
    this.startQuery(params);
    this._status = this._wasm.step(this._stmt);
    let row = void 0;
    if (this._status === Status.SqliteRow) {
      row = this.getQueryRow();
    }
    while (this._status === Status.SqliteRow) {
      this._status = this._wasm.step(this._stmt);
    }
    if (this._status !== Status.SqliteDone) {
      throw new SqliteError(this._wasm, this._status);
    }
    return row;
  }
  firstEntry(params) {
    const row = this.first(params);
    return row === void 0 ? void 0 : this.makeRowObject(row);
  }
  one(params) {
    const rows = this.all(params);
    if (rows.length === 0) {
      throw new SqliteError("The query did not return any rows.");
    } else if (rows.length > 1) {
      throw new SqliteError("The query returned more than one row.");
    } else {
      return rows[0];
    }
  }
  oneEntry(params) {
    return this.makeRowObject(this.one(params));
  }
  execute(params) {
    this.startQuery(params);
    this._status = this._wasm.step(this._stmt);
    while (this._status === Status.SqliteRow) {
      this._status = this._wasm.step(this._stmt);
    }
    if (this._status !== Status.SqliteDone) {
      throw new SqliteError(this._wasm, this._status);
    }
  }
  finalize() {
    if (!this._finalized) {
      this._wasm.finalize(this._stmt);
      this._openStatements.delete(this._stmt);
      this._finalized = true;
    }
  }
  columns() {
    if (this._finalized) {
      throw new SqliteError(
        "Unable to retrieve column names from finalized transaction."
      );
    }
    const columnCount = this._wasm.column_count(this._stmt);
    const columns = [];
    for (let i = 0; i < columnCount; i++) {
      const name = getStr(this._wasm, this._wasm.column_name(this._stmt, i));
      const originName = getStr(
        this._wasm,
        this._wasm.column_origin_name(this._stmt, i)
      );
      const tableName = getStr(
        this._wasm,
        this._wasm.column_table_name(this._stmt, i)
      );
      columns.push({ name, originName, tableName });
    }
    return columns;
  }
}
