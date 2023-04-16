import { Status } from "./constants.js";
import { getStr } from "./wasm.js";
export class SqliteError extends Error {
  constructor(context, code) {
    let message;
    let status;
    if (typeof context === "string") {
      message = context;
      status = Status.Unknown;
    } else {
      message = getStr(context, context.get_sqlite_error_str());
      status = context.get_status();
    }
    super(message);
    this.code = code ?? status;
    this.name = "SqliteError";
  }
  get codeName() {
    return Status[this.code];
  }
}
