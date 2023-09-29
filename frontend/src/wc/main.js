import wc from "./wc.svelte";
import "../base.css";

const args = {
  target: document.getElementById("app"),
};
const app = new wc(args);
console.log("app:", app);
