export function collabSyscalls(editor) {
  return {
    "collab.start": (_ctx, serverUrl, token, username) => {
      editor.startCollab(serverUrl, token, username);
    },
    "collab.stop": (_ctx) => {
      editor.collabState?.stop();
    }
  };
}
