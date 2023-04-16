import { Decoration, WidgetType, syntaxTree } from "../deps.js";
import { decoratorStateField, isCursorInRange } from "./util.js";
const bulletListMarkerRE = /^[-+*]/;
export function listBulletPlugin() {
  return decoratorStateField((state) => {
    const widgets = [];
    syntaxTree(state).iterate({
      enter: ({ type, from, to }) => {
        if (isCursorInRange(state, [from, to])) return;
        if (type.name === "ListMark") {
          const listMark = state.sliceDoc(from, to);
          if (bulletListMarkerRE.test(listMark)) {
            const dec = Decoration.replace({
              widget: new ListBulletWidget(listMark),
            });
            widgets.push(dec.range(from, to));
          }
        }
      },
    });
    return Decoration.set(widgets, true);
  });
}
class ListBulletWidget extends WidgetType {
  constructor(bullet) {
    super();
    this.bullet = bullet;
  }
  toDOM() {
    const listBullet = document.createElement("span");
    listBullet.textContent = this.bullet;
    listBullet.className = "cm-list-bullet";
    return listBullet;
  }
}
