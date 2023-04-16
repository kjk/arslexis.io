import {
  Decoration,
  EditorView,
  foldedRanges,
  StateField,
  WidgetType
} from "../deps.ts";
export class LinkWidget extends WidgetType {
  constructor(options) {
    super();
    this.options = options;
  }
  toDOM() {
    const anchor = document.createElement("a");
    anchor.className = this.options.cssClass;
    anchor.textContent = this.options.text;
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.options.callback(e);
    });
    anchor.setAttribute("title", this.options.title);
    anchor.href = this.options.href || "#";
    return anchor;
  }
}
export class HtmlWidget extends WidgetType {
  constructor(html, className, onClick) {
    super();
    this.html = html;
    this.className = className;
    this.onClick = onClick;
  }
  toDOM() {
    const el = document.createElement("span");
    if (this.className) {
      el.className = this.className;
    }
    if (this.onClick) {
      el.addEventListener("click", this.onClick);
    }
    el.innerHTML = this.html;
    return el;
  }
}
export function decoratorStateField(stateToDecoratorMapper) {
  return StateField.define({
    create(state) {
      return stateToDecoratorMapper(state);
    },
    update(value, tr) {
      return stateToDecoratorMapper(tr.state);
    },
    provide: (f) => EditorView.decorations.from(f)
  });
}
export class ButtonWidget extends WidgetType {
  constructor(text, title, cssClass, callback) {
    super();
    this.text = text;
    this.title = title;
    this.cssClass = cssClass;
    this.callback = callback;
  }
  toDOM() {
    const anchor = document.createElement("button");
    anchor.className = this.cssClass;
    anchor.textContent = this.text;
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.callback(e);
    });
    anchor.setAttribute("title", this.title);
    return anchor;
  }
}
export function checkRangeOverlap(range1, range2) {
  return range1[0] <= range2[1] && range2[0] <= range1[1];
}
export function checkRangeSubset(parent, child) {
  return child[0] >= parent[0] && child[1] <= parent[1];
}
export function isCursorInRange(state, range) {
  return state.selection.ranges.some(
    (selection) => checkRangeOverlap(range, [selection.from, selection.to])
  );
}
export const invisibleDecoration = Decoration.replace({});
export function editorLines(view, from, to) {
  let lines = view.viewportLineBlocks.filter(
    (block) => checkRangeOverlap([block.from, block.to], [from, to])
  );
  const folded = foldedRanges(view.state).iter();
  while (folded.value) {
    lines = lines.filter(
      (line) => !checkRangeOverlap(
        [folded.from, folded.to],
        [line.from, line.to]
      )
    );
    folded.next();
  }
  return lines;
}
