import "../base.css";

import App from "./qrscanner.svelte";

const args = {
  target: document.getElementById("app"),
};
const app = new App(args);
console.log("app:", app);
