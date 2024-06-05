import "../base.css";

import fm from "./fm.svelte";
import { mount } from "svelte";

const args = {
  target: document.getElementById("app"),
};
const app = mount(fm, args);
export default app;
