import { IDM_VIEW_HIGHLIGHTCURRENTLINE_BACK } from "./menu-notepad2";

// global Notepad2 settings
export class Settings {
  showMenu = true;
  showToolbar = true;
  showStatusBar = true;

  showLineNumbers = true;
  showWhitespace = false;
  wordWrap = true;
  readOnly = false;
  enableMultipleSelection = true;
  tabsAsSpaces = true;
  tabSpaces = 4;
  tabSize = 4;
  visualBraceMatching = true;
  lineSeparator = null;
  showTrailingWhitespace = true;

  lineHighlightType = IDM_VIEW_HIGHLIGHTCURRENTLINE_BACK;

  rememberRecentFiles = true;
}
