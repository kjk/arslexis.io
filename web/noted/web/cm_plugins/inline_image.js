import { Decoration, WidgetType, syntaxTree } from "../deps.js";

import { decoratorStateField } from "./util.js";

class InlineImageWidget extends WidgetType {
  constructor(url, title, space) {
    super();
    this.url = url;
    this.title = title;
    this.space = space;
  }
  eq(other) {
    return other.url === this.url && other.title === this.title;
  }
  toDOM() {
    const img = document.createElement("img");
    if (this.url.startsWith("http")) {
      img.src = this.url;
    } else {
      this.space
        .readAttachment(decodeURIComponent(this.url), "dataurl")
        .then(({ data }) => {
          img.src = data;
        });
    }
    img.alt = this.title;
    img.title = this.title;
    img.style.display = "block";
    img.className = "sb-inline-img";
    return img;
  }
}
export function inlineImagesPlugin(space) {
  return decoratorStateField((state) => {
    const widgets = [];
    const imageRegex = /!\[(?<title>[^\]]*)\]\((?<url>.+)\)/;
    syntaxTree(state).iterate({
      enter: (node) => {
        if (node.name !== "Image") {
          return;
        }
        const imageRexexResult = imageRegex.exec(
          state.sliceDoc(node.from, node.to)
        );
        if (imageRexexResult === null || !imageRexexResult.groups) {
          return;
        }
        const url = imageRexexResult.groups.url;
        const title = imageRexexResult.groups.title;
        widgets.push(
          Decoration.widget({
            widget: new InlineImageWidget(url, title, space),
            block: true,
          }).range(node.to)
        );
      },
    });
    return Decoration.set(widgets, true);
  });
}
