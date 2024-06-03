import "../base.css";

import fm from "./fm.svelte";

const args = {
  target: document.getElementById("app"),
};
const app = new fm(args);
console.log("app:", app);
