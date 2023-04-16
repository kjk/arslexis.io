export const initialViewState = {
  isLoading: false,
  showPageNavigator: false,
  showCommandPalette: false,
  unsavedChanges: false,
  uiOptions: {
    vimMode: false,
    darkMode: false,
    forcedROMode: false
  },
  panels: {
    lhs: {},
    rhs: {},
    bhs: {},
    modal: {}
  },
  allPages: /* @__PURE__ */ new Set(),
  commands: /* @__PURE__ */ new Map(),
  recentCommands: /* @__PURE__ */ new Map(),
  notifications: [],
  showFilterBox: false,
  filterBoxHelpText: "",
  filterBoxLabel: "",
  filterBoxOnSelect: () => {
  },
  filterBoxOptions: [],
  filterBoxPlaceHolder: "",
  showPrompt: false,
  showConfirm: false
};
