import { Tag } from "../deps.js";
export function mdExtensionSyntaxConfig({ regex, firstCharCodes, nodeType }) {
  return {
    defineNodes: [nodeType],
    parseInline: [
      {
        name: nodeType,
        parse(cx, next, pos) {
          if (!firstCharCodes.includes(next)) {
            return -1;
          }
          let match = regex.exec(cx.slice(pos, cx.end));
          if (!match) {
            return -1;
          }
          return cx.addElement(cx.elt(nodeType, pos, pos + match[0].length));
        },
      },
    ],
  };
}
export function mdExtensionStyleTags({ nodeType, tag }) {
  return {
    [nodeType]: tag,
  };
}
export function loadMarkdownExtensions(system) {
  const mdExtensions = [];
  for (const plug of system.loadedPlugs.values()) {
    const manifest = plug.manifest;
    if (manifest.syntax) {
      for (const [nodeType, def] of Object.entries(manifest.syntax)) {
        mdExtensions.push({
          nodeType,
          tag: Tag.define(),
          firstCharCodes: def.firstCharacters.map((ch) => ch.charCodeAt(0)),
          regex: new RegExp("^" + def.regex),
          styles: def.styles,
          className: def.className,
        });
      }
    }
  }
  return mdExtensions;
}
