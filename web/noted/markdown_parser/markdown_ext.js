/*
export type MDExt = {
  firstCharCodes: number[],
  regex: RegExp,
  nodeType: string,
  tag: Tag,
  styles: { [key: string]: string },
  className?: string,
};
*/

/**
 * @typedef {Object} MdExt
 * @param {number[]} firstCharCodes  // unicode char code for efficiency .charCodeAt(0)
 * @param {RegExp} regex
 * @param {string} nodeType
 * @param {import("@lezer/highlight").Tag} tag
 * @param {Object.<string, string>} styles
 * @param {string} [className]
 */

/** @returns {MarkdownConfig} */
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
        // after: "Emphasis",
      },
    ],
  };
}

export function mdExtensionStyleTags({ nodeType, tag }) {
  return {
    [nodeType]: tag,
  };
}
