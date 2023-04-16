import { EditorView, Vim, vimGetCm } from "../deps.js";
export function editorSyscalls(editor) {
  const syscalls = {
    "editor.getCurrentPage": () => {
      return editor.currentPage;
    },
    "editor.getText": () => {
      return editor.editorView?.state.sliceDoc();
    },
    "editor.getCursor": () => {
      return editor.editorView.state.selection.main.from;
    },
    "editor.getSelection": () => {
      return editor.editorView.state.selection.main;
    },
    "editor.save": () => {
      return editor.save(true);
    },
    "editor.navigate": async (
      _ctx,
      name,
      pos,
      replaceState = false,
      newWindow = false
    ) => {
      await editor.navigate(name, pos, replaceState, newWindow);
    },
    "editor.reloadPage": async () => {
      await editor.reloadPage();
    },
    "editor.openUrl": (_ctx, url) => {
      const win = window.open(url, "_blank");
      if (win) {
        win.focus();
      }
    },
    "editor.downloadFile": (_ctx, filename, dataUrl) => {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      link.click();
    },
    "editor.flashNotification": (_ctx, message, type = "info") => {
      editor.flashNotification(message, type);
    },
    "editor.filterBox": (
      _ctx,
      label,
      options,
      helpText = "",
      placeHolder = ""
    ) => {
      return editor.filterBox(label, options, helpText, placeHolder);
    },
    "editor.showPanel": (_ctx, id, mode, html, script) => {
      editor.viewDispatch({
        type: "show-panel",
        id,
        config: { html, script, mode },
      });
    },
    "editor.hidePanel": (_ctx, id) => {
      editor.viewDispatch({
        type: "hide-panel",
        id,
      });
    },
    "editor.insertAtPos": (_ctx, text, pos) => {
      editor.editorView.dispatch({
        changes: {
          insert: text,
          from: pos,
        },
      });
    },
    "editor.replaceRange": (_ctx, from, to, text) => {
      editor.editorView.dispatch({
        changes: {
          insert: text,
          from,
          to,
        },
      });
    },
    "editor.moveCursor": (_ctx, pos, center = false) => {
      editor.editorView.dispatch({
        selection: {
          anchor: pos,
        },
      });
      if (center) {
        editor.editorView.dispatch({
          effects: [
            EditorView.scrollIntoView(pos, {
              y: "center",
            }),
          ],
        });
      }
    },
    "editor.setSelection": (_ctx, from, to) => {
      const editorView = editor.editorView;
      editorView.dispatch({
        selection: {
          anchor: from,
          head: to,
        },
      });
    },
    "editor.insertAtCursor": (_ctx, text) => {
      const editorView = editor.editorView;
      const from = editorView.state.selection.main.from;
      editorView.dispatch({
        changes: {
          insert: text,
          from,
        },
        selection: {
          anchor: from + text.length,
        },
      });
    },
    "editor.dispatch": (_ctx, change) => {
      editor.editorView.dispatch(change);
    },
    "editor.prompt": (_ctx, message, defaultValue = "") => {
      return editor.prompt(message, defaultValue);
    },
    "editor.confirm": (_ctx, message) => {
      return editor.confirm(message);
    },
    "editor.getUiOption": (_ctx, key) => {
      return editor.viewState.uiOptions[key];
    },
    "editor.setUiOption": (_ctx, key, value) => {
      editor.viewDispatch({
        type: "set-ui-option",
        key,
        value,
      });
    },
    "editor.vimEx": (_ctx, exCommand) => {
      const cm = vimGetCm(editor.editorView);
      return Vim.handleEx(cm, exCommand);
    },
  };
  return syscalls;
}
