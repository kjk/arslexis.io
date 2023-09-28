import "../base.css";

import Unzip from "./ComicBookReader.svelte";

const args = {
  target: document.getElementById("app"),
};
const app = new Unzip(args);
console.log(app);
