import "./base.css";

import Main from "./Main.svelte";

const args = {
  target: document.getElementById("app"),
};
const app = new Main(args);
export default app;
