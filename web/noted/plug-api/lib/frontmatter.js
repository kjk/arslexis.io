import * as YAML from "yaml";

import {
  addParentPointers,
  findNodeOfType,
  renderToText,
  replaceNodesMatching,
  traverseTree,
} from "./tree.js";

export function extractFrontmatter(tree, removeKeys = []) {
  let data = {};
  addParentPointers(tree);
  replaceNodesMatching(tree, (t) => {
    if (t.type === "Hashtag") {
      if (t.parent && t.parent.type === "Paragraph") {
        const tagname = t.children[0].text.substring(1);
        if (!data.tags) {
          data.tags = [];
        }
        if (Array.isArray(data.tags) && !data.tags.includes(tagname)) {
          data.tags.push(tagname);
        }
      }
      return;
    }
    if (t.type === "FrontMatter") {
      const yamlNode = t.children[1].children[0];
      const yamlText = renderToText(yamlNode);
      try {
        const parsedData2 = YAML.parse(yamlText);
        const newData2 = { ...parsedData2 };
        data = { ...data, ...parsedData2 };
        if (removeKeys.length > 0) {
          let removedOne = false;
          for (const key of removeKeys) {
            if (key in newData2) {
              delete newData2[key];
              removedOne = true;
            }
          }
          if (removedOne) {
            yamlNode.text = YAML.stringify(newData2);
          }
        }
        if (Object.keys(newData2).length === 0) {
          return null;
        }
      } catch (e) {
        console.error("Could not parse frontmatter", e);
      }
    }
    if (t.type !== "FencedCode") {
      return;
    }
    const codeInfoNode = findNodeOfType(t, "CodeInfo");
    if (!codeInfoNode) {
      return;
    }
    if (codeInfoNode.children[0].text !== "meta") {
      return;
    }
    const codeTextNode = findNodeOfType(t, "CodeText");
    if (!codeTextNode) {
      return;
    }
    const codeText = codeTextNode.children[0].text;
    const parsedData = YAML.parse(codeText);
    const newData = { ...parsedData };
    data = { ...data, ...parsedData };
    if (removeKeys.length > 0) {
      let removedOne = false;
      for (const key of removeKeys) {
        if (key in newData) {
          delete newData[key];
          removedOne = true;
        }
      }
      if (removedOne) {
        codeTextNode.children[0].text = YAML.stringify(newData).trim();
      }
    }
    if (Object.keys(newData).length === 0) {
      return null;
    }
    return void 0;
  });
  if (data.name) {
    data.displayName = data.name;
    delete data.name;
  }
  return data;
}
export function prepareFrontmatterDispatch(tree, data) {
  let dispatchData = null;
  traverseTree(tree, (t) => {
    if (t.type === "FrontMatter") {
      const bodyNode = t.children[1].children[0];
      const yamlText = renderToText(bodyNode);
      try {
        const parsedYaml = YAML.parse(yamlText);
        const newData = { ...parsedYaml, ...data };
        // TODO: noArrayIndent: true to YAML.stringify()
        dispatchData = {
          changes: {
            from: bodyNode.from,
            to: bodyNode.to,
            insert: YAML.stringify(newData, {}),
          },
        };
      } catch (e) {
        console.error("Error parsing YAML", e);
      }
      return true;
    }
    return false;
  });
  if (!dispatchData) {
    // TODO: noArrayIndent: true to YAML.stringify()
    dispatchData = {
      changes: {
        from: 0,
        to: 0,
        insert: "---\n" + YAML.stringify(data, {}) + "---\n",
      },
    };
  }
  return dispatchData;
}
