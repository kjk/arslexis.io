import { Decoration, WidgetType, syntaxTree } from "../deps.js";
import { decoratorStateField, isCursorInRange } from "./util.js";
class CheckboxWidget extends WidgetType {
  constructor(checked, pos, clickCallback) {
    super();
    this.checked = checked;
    this.pos = pos;
    this.clickCallback = clickCallback;
  }
  toDOM() {
    const wrap = document.createElement("span");
    wrap.classList.add("sb-checkbox");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = this.checked;
    checkbox.addEventListener("click", (e) => {
      e.stopPropagation();
      this.clickCallback(this.pos);
    });
    wrap.appendChild(checkbox);
    return wrap;
  }
}
export function taskListPlugin({ onCheckboxClick }) {
  return decoratorStateField((state) => {
    const widgets = [];
    syntaxTree(state).iterate({
      enter({ type, from, to, node }) {
        if (type.name !== "Task") return;
        let checked = false;
        node.toTree().iterate({
          enter: (ref) => iterateInner(ref.type, ref.from, ref.to),
        });
        if (checked) {
          widgets.push(
            Decoration.mark({
              tagName: "span",
              class: "cm-task-checked",
            }).range(from, to)
          );
        }
        function iterateInner(type2, nfrom, nto) {
          if (type2.name !== "TaskMarker") return;
          if (isCursorInRange(state, [from + nfrom, from + nto])) return;
          const checkbox = state.sliceDoc(from + nfrom, from + nto);
          if ("xX".includes(checkbox[1])) checked = true;
          const dec = Decoration.replace({
            widget: new CheckboxWidget(
              checked,
              from + nfrom + 1,
              onCheckboxClick
            ),
          });
          widgets.push(dec.range(from + nfrom, from + nto));
        }
      },
    });
    return Decoration.set(widgets, true);
  });
}
