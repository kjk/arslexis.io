import "../base.css";

import wc from "./fm.svelte";

const args = {
  target: document.getElementById("app"),
};
const app = new wc(args);
console.log("app:", app);
