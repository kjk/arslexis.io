export class ConsoleLogger {
  constructor(callback, print = true) {
    this.print = print;
    this.callback = callback;
  }
  log(...args) {
    this.push("log", args);
  }
  warn(...args) {
    this.push("warn", args);
  }
  error(...args) {
    this.push("error", args);
  }
  info(...args) {
    this.push("info", args);
  }
  push(level, args) {
    this.callback(level, this.logMessage(args));
    if (this.print) {
      console[level](...args);
    }
  }
  logMessage(values) {
    const pieces = [];
    for (const val of values) {
      switch (typeof val) {
        case "string":
        case "number":
          pieces.push("" + val);
          break;
        case "undefined":
          pieces.push("undefined");
          break;
        default:
          try {
            let s = JSON.stringify(val, null, 2);
            if (s.length > 500) {
              s = s.substring(0, 500) + "...";
            }
            pieces.push(s);
          } catch {
            pieces.push("[circular object]");
          }
      }
    }
    return pieces.join(" ");
  }
}
