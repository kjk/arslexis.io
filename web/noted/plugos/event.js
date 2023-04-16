export class EventEmitter {
  constructor() {
    this.handlers = [];
  }
  on(handlers) {
    this.handlers.push(handlers);
  }
  off(handlers) {
    this.handlers = this.handlers.filter((h) => h !== handlers);
  }
  async emit(eventName, ...args) {
    for (const handler of this.handlers) {
      const fn = handler[eventName];
      if (fn) {
        await Promise.resolve(fn(...args));
      }
    }
  }
}
