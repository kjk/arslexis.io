import "../base.css";

import App from "./GoPlayground.svelte";

const args = {
  target: document.getElementById("app"),
};
export const app = new App(args);
