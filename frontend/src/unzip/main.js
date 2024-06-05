import "../base.css";

import Unzip from "./Unzip.svelte";
import { mount } from "svelte";

const args = {
  target: document.getElementById("app"),
};
const app = mount(Unzip, args);
export default app;
