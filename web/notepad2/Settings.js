import * as m from "./menu-notepad2";

// global Notepad2 settings
export class Settings {
  showMenu = true;
  showToolbar = true;
  showStatusBar = true;

  showLineNumbers = true;
  showWhitespace = false;
  wordWrap = true;
  readOnly = false;
  scrollPastEnd = m.IDM_VIEW_SCROLLPASTLASTLINE_NO;
  enableMultipleSelection = true;
  tabsAsSpaces = true;
  tabSpaces = 4;
  tabSize = 4;
  visualBraceMatching = true;
  lineSeparator = null;
  showTrailingWhitespace = true;
  // show / hide cold folding gutter
  showCodeFolding = true;
  showIndentGuides = true;
  lineHighlightType = m.IDM_VIEW_HIGHLIGHTCURRENTLINE_BACK;
  rememberRecentFiles = true;
}

export const settings = new Settings();
