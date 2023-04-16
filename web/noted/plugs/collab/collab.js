import * as YAML from "yaml";

import {
  clientStore,
  collab,
  editor,
  markdown,
} from "$sb/silverbullet-syscall/mod.js";
import {
  extractFrontmatter,
  prepareFrontmatterDispatch,
} from "$sb/lib/frontmatter.js";
import {
  findNodeOfType,
  removeParentPointers,
  renderToText,
} from "$sb/lib/tree.js";

import { base64EncodedDataUrl } from "../../plugos/asset_bundle/base64.js";
import { getText } from "$sb/silverbullet-syscall/editor.js";
import { nanoid } from "https://esm.sh/nanoid@4.0.0";
import { parseMarkdown } from "$sb/silverbullet-syscall/markdown.js";
const defaultServer = "wss://collab.silverbullet.md";
async function ensureUsername() {
  let username = await clientStore.get("collabUsername");
  if (!username) {
    username = await editor.prompt(
      "Please enter a publicly visible user name (or cancel for 'anonymous'):"
    );
    if (!username) {
      return "anonymous";
    } else {
      await clientStore.set("collabUsername", username);
    }
  }
  return username;
}
export async function joinCommand() {
  let collabUri = await editor.prompt("Collab share URI:");
  if (!collabUri) {
    return;
  }
  if (!collabUri.startsWith("collab:")) {
    collabUri = "collab:" + collabUri;
  }
  await editor.navigate(collabUri);
}
export async function shareCommand() {
  const serverUrl = await editor.prompt(
    "Please enter the URL of the collab server to use:",
    defaultServer
  );
  if (!serverUrl) {
    return;
  }
  const roomId = nanoid().replaceAll("_", "-");
  await editor.save();
  const text = await editor.getText();
  const tree = await markdown.parseMarkdown(text);
  let { $share } = extractFrontmatter(tree);
  if (!$share) {
    $share = [];
  }
  if (!Array.isArray($share)) {
    $share = [$share];
  }
  removeParentPointers(tree);
  const dispatchData = prepareFrontmatterDispatch(tree, {
    $share: [...$share, `collab:${serverUrl}/${roomId}`],
  });
  await editor.dispatch(dispatchData);
  collab.start(serverUrl, roomId, await ensureUsername());
}
export async function detectPage() {
  const tree = await parseMarkdown(await getText());
  const frontMatter = findNodeOfType(tree, "FrontMatter");
  if (frontMatter) {
    const yamlText = renderToText(frontMatter.children[1].children[0]);
    try {
      let { $share } = YAML.parse(yamlText);
      if (!$share) {
        return;
      }
      if (!Array.isArray($share)) {
        $share = [$share];
      }
      for (const uri of $share) {
        if (uri.startsWith("collab:")) {
          console.log("Going to enable collab");
          const uriPieces = uri.substring("collab:".length).split("/");
          await collab.start(
            uriPieces.slice(0, uriPieces.length - 1).join("/"),
            uriPieces[uriPieces.length - 1],
            await ensureUsername()
          );
        }
      }
    } catch (e) {
      console.error("Error parsing YAML", e);
    }
  }
}
export function shareNoop() {
  return true;
}
export async function readFileCollab(name, encoding) {
  if (!name.endsWith(".md")) {
    throw new Error("File not found");
  }
  const collabUri = name.substring(0, name.length - ".md".length);
  const text = `---
$share: ${collabUri}
---
`;
  return {
    data:
      encoding === "utf8"
        ? text
        : base64EncodedDataUrl("text/markdown", new TextEncoder().encode(text)),
    meta: {
      name,
      contentType: "text/markdown",
      size: text.length,
      lastModified: 0,
      perm: "rw",
    },
  };
}
export function getFileMetaCollab(name) {
  return {
    name,
    contentType: "text/markdown",
    size: -1,
    lastModified: 0,
    perm: "rw",
  };
}
export function writeFileCollab(name) {
  return {
    name,
    contentType: "text/markdown",
    size: -1,
    lastModified: 0,
    perm: "rw",
  };
}
