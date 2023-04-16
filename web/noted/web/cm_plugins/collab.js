import { WebsocketProvider, Y, yCollab } from "../deps.js";
const userColors = [
  { color: "#30bced", light: "#30bced33" },
  { color: "#6eeb83", light: "#6eeb8333" },
  { color: "#ffbc42", light: "#ffbc4233" },
  { color: "#ecd444", light: "#ecd44433" },
  { color: "#ee6352", light: "#ee635233" },
  { color: "#9ac2c9", light: "#9ac2c933" },
  { color: "#8acb88", light: "#8acb8833" },
  { color: "#1be7ff", light: "#1be7ff33" },
];
export class CollabState {
  constructor(serverUrl, token, username) {
    this.ydoc = new Y.Doc();
    this.collabProvider = new WebsocketProvider(serverUrl, token, this.ydoc);
    this.collabProvider.on("status", (e) => {
      console.log("Collab status change", e);
    });
    this.collabProvider.on("sync", (e) => {
      console.log("Sync status", e);
    });
    this.ytext = this.ydoc.getText("codemirror");
    this.yundoManager = new Y.UndoManager(this.ytext);
    const randomColor =
      userColors[Math.floor(Math.random() * userColors.length)];
    this.collabProvider.awareness.setLocalStateField("user", {
      name: username,
      color: randomColor.color,
      colorLight: randomColor.light,
    });
  }
  stop() {
    this.collabProvider.destroy();
  }
  collabExtension() {
    return yCollab(this.ytext, this.collabProvider.awareness, {
      undoManager: this.yundoManager,
    });
  }
}
