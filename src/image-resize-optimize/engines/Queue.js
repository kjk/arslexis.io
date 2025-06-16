export class Queue {
  max;
  // Current task list
  list = [];
  // Indicate whether task queue running
  isRunning = false;
  /**
   *
   * @param max  Maximun concurrent task number
   */
  constructor(max = 1) {
    this.max = max;
  }
  /**
   * Add new task for executing
   * @param task
   */
  push(task) {
    this.list.push(task);
    if (!this.isRunning) {
      this.do();
    }
  }
  /**
   * Execute a batch of tasks
   * @returns
   */
  async do() {
    // If list is empty, end run
    if (this.list.length === 0) {
      this.isRunning = false;
      return;
    }
    this.isRunning = true;
    const takeList = [];
    for (let i = 0; i < this.max; i++) {
      const task = this.list.shift();
      if (task) {
        takeList.push(task);
      }
    }
    // Execute all task
    const runningList = takeList.map((task) => task());
    await Promise.all(runningList);
    // Execute next batch
    await this.do();
  }
}
