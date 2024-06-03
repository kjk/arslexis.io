import "../base.css";

import wc from "./wc.svelte";

const args = {
  target: document.getElementById("app"),
};
const app = new wc(args);
console.log("app:", app);
