import "../base.css";

import App from "./Calc.svelte";
import { mount } from "svelte";

const args = {
  target: document.getElementById("app"),
};
const app = mount(App, args);
export default app;
