import commonSpaceSyscalls from "../../common/syscalls/space.js";
export function spaceSyscalls(editor) {
  const syscalls = commonSpaceSyscalls(editor.space);
  syscalls["space.deletePage"] = async (_ctx, name) => {
    if (editor.currentPage === name) {
      await editor.navigate("");
    }
    editor.openPages.delete(name);
    console.log("Deleting page");
    await editor.space.deletePage(name);
  };
  return syscalls;
}
