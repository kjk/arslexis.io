import Unzip from "./Unzip.svelte";
import "../base.css";

const args = {
  target: document.getElementById("app"),
};
const app = new Unzip(args);
console.log(app);
