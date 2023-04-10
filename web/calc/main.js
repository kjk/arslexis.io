import "../base.css";

import App from "./Calc.svelte";

const args = {
  target: document.getElementById("app"),
};
export const app = new App(args);
