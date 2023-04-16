import {
  addParentPointers,
  collectNodesMatching,
  collectNodesOfType,
  findNodeOfType,
  nodeAtPos,
  renderToText,
  replaceNodesMatching,
} from "$sb/lib/tree.js";
import { applyQuery, removeQueries } from "$sb/lib/query.js";
import {
  editor,
  index,
  markdown,
  space,
} from "$sb/silverbullet-syscall/mod.js";

import { niceDate } from "$sb/lib/dates.js";
function getDeadline(deadlineNode) {
  return deadlineNode.children[0].text.replace(/📅\s*/, "");
}
export async function indexTasks({ name, tree }) {
  const tasks = [];
  removeQueries(tree);
  addParentPointers(tree);
  collectNodesOfType(tree, "Task").forEach((n) => {
    const complete = n.children[0].children[0].text !== "[ ]";
    const task = {
      name: "",
      done: complete,
    };
    replaceNodesMatching(n, (tree2) => {
      if (tree2.type === "DeadlineDate") {
        task.deadline = getDeadline(tree2);
        return null;
      }
      if (tree2.type === "Hashtag") {
        if (!task.tags) {
          task.tags = [];
        }
        task.tags.push(tree2.children[0].text.substring(1));
      }
    });
    task.name = n.children.slice(1).map(renderToText).join("").trim();
    const taskIndex = n.parent.children.indexOf(n);
    const nestedItems = n.parent.children.slice(taskIndex + 1);
    if (nestedItems.length > 0) {
      task.nested = nestedItems.map(renderToText).join("").trim();
    }
    tasks.push({
      key: `task:${n.from}`,
      value: task,
    });
  });
  await index.batchSet(name, tasks);
}
export function taskToggle(event) {
  return taskToggleAtPos(event.pos);
}
export function previewTaskToggle(eventString) {
  const [eventName, pos] = JSON.parse(eventString);
  if (eventName === "task") {
    return taskToggleAtPos(+pos);
  }
}
async function toggleTaskMarker(node, moveToPos) {
  let changeTo = "[x]";
  if (node.children[0].text === "[x]" || node.children[0].text === "[X]") {
    changeTo = "[ ]";
  }
  await editor.dispatch({
    changes: {
      from: node.from,
      to: node.to,
      insert: changeTo,
    },
  });
  const parentWikiLinks = collectNodesMatching(
    node.parent,
    (n) => n.type === "WikiLinkPage"
  );
  for (const wikiLink of parentWikiLinks) {
    const ref = wikiLink.children[0].text;
    if (ref.includes("@")) {
      const [page, pos] = ref.split("@");
      let text = await space.readPage(page);
      const referenceMdTree = await markdown.parseMarkdown(text);
      const taskMarkerNode = nodeAtPos(referenceMdTree, +pos + 1);
      if (!taskMarkerNode || taskMarkerNode.type !== "TaskMarker") {
        console.error(
          "Reference not a task marker, out of date?",
          taskMarkerNode
        );
        return;
      }
      taskMarkerNode.children[0].text = changeTo;
      text = renderToText(referenceMdTree);
      await space.writePage(page, text);
    }
  }
}
export async function taskToggleAtPos(pos) {
  const text = await editor.getText();
  const mdTree = await markdown.parseMarkdown(text);
  addParentPointers(mdTree);
  const node = nodeAtPos(mdTree, pos);
  if (node && node.type === "TaskMarker") {
    await toggleTaskMarker(node, pos);
  }
}
export async function taskToggleCommand() {
  const text = await editor.getText();
  const pos = await editor.getCursor();
  const tree = await markdown.parseMarkdown(text);
  addParentPointers(tree);
  const node = nodeAtPos(tree, pos);
  const taskMarker = findNodeOfType(node, "TaskMarker");
  await toggleTaskMarker(taskMarker, pos);
}
export async function postponeCommand() {
  const text = await editor.getText();
  const pos = await editor.getCursor();
  const tree = await markdown.parseMarkdown(text);
  addParentPointers(tree);
  const node = nodeAtPos(tree, pos);
  const date = getDeadline(node);
  const option = await editor.filterBox(
    "Postpone for...",
    [
      { name: "a day", orderId: 1 },
      { name: "a week", orderId: 2 },
      { name: "following Monday", orderId: 3 },
    ],
    "Select the desired time span to delay this task"
  );
  if (!option) {
    return;
  }
  const d = new Date(date);
  switch (option.name) {
    case "a day":
      d.setDate(d.getDate() + 1);
      break;
    case "a week":
      d.setDate(d.getDate() + 7);
      break;
    case "following Monday":
      d.setDate(d.getDate() + ((7 - d.getDay() + 1) % 7 || 7));
      break;
  }
  await editor.dispatch({
    changes: {
      from: node.from,
      to: node.to,
      insert: `\u{1F4C5} ${niceDate(d)}`,
    },
    selection: {
      anchor: pos,
    },
  });
}
export async function queryProvider({ query }) {
  const allTasks = [];
  for (const { key, page, value } of await index.queryPrefix("task:")) {
    const pos = key.split(":")[1];
    allTasks.push({
      ...value,
      page,
      pos,
    });
  }
  return applyQuery(query, allTasks);
}
