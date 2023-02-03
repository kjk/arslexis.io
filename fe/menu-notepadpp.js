// commands
export const cmdFileNew = "cmdFileNew";
export const cmdFileOpen = "cmdFileOpen";
export const cmdFileOpenContainingFolder = "cmdFileOpenContainingFolder";
export const cmdFileReloadFromDisk = "cmdFileReloadFromDisk";
export const cmdFileSave = "cmdFileSave";
export const cmdFileSaveAs = "cmdFileSaveAs";
export const cmdFileSaveCopyAs = "cmdFileSaveCopyAs";
export const cmdFileSaveAll = "cmdFileSaveAll";
export const cmdFileRename = "cmdFileRename";
export const cmdFileClose = "cmdFileClose";
export const cmdFileCloseAll = "cmdFileCloseAll";
export const cmdFileMoveToRecycleBin = "cmdFileMoveToRecycleBin";
export const cmdFileLoadSession = "cmdFileLoadSession";
export const cmdFileSaveSession = "cmdFileSaveSession";
export const cmdFilePrint = "cmdFilePrint";
export const cmdFilePrintNow = "cmdFilePrintNow";
export const cmdFileRestoreRecentClosedFile = "cmdFileRestoreRecentClosedFile";
export const cmdFileOpenAllRecentFiles = "cmdFileOpenAllRecentFiles";
export const cmdFileEmptyRecentFileList = "cmdFileEmptyRecentFileList";

export const cmdEditUndo = "cmdEditUndo";
export const cmdEditRedo = "cmdEditRedo";
export const cmdEditCut = "cmdEditCut";
export const cmdEditCopy = "cmdEditCopy";
export const cmdEditPaste = "cmdEditPaste";
export const cmdEditDelete = "cmdEditDelete";
export const cmdEditSelectAll = "cmdEditSelectAll";
export const cmdEditBeginEditSelect = "cmdEditBeginEditSelect";

export const cmdEditInsertDateTimeShort = "cmdEditInsertDateTimeShort";
export const cmdEditInsertDateTimeLong = "cmdEditInsertDateTimeLong";
export const cmdEditInsertDateTimeCustomized =
  "cmdEditInsertDateTimeCustomized";

const menuDiv = "---";

const menuFile = [
  ["New", cmdFileNew, "Ctrl+N"],
  ["Open", cmdFileOpen, "Ctrl+O"],
  // ["Open Containing Folder",,],
  ["Open in Default Viewer"],
  ["Open Fodler as Workspace..."],
  ["Reload from Disk", cmdFileReloadFromDisk, "Ctrl-R"],
  ["Save", cmdFileSave, "Ctrl+S"],
  ["Save As..", cmdFileSaveAs, "Ctrl+Alt+S"],
  ["Save a Copy As...", cmdFileSaveCopyAs],
  ["Save All", cmdFileSaveAll, "Ctrl+Shift+S"],
  ["Rename...", cmdFileRename],
  ["Close", cmdFileClose, "Ctrl+W"],
  ["Close All", cmdFileCloseAll, "Ctrl+Shift+W"],
  ["Close Multiple Documents", []],
  ["Move to Recycle Bin"],
  menuDiv,
  ["Load Session...", cmdFileLoadSession],
  ["Save Session...", cmdFileSaveSession],
  menuDiv,
  ["Print...", cmdFilePrint, "Ctrl+P"],
  ["Print Now", cmdFilePrintNow],
  menuDiv,
  // TODO: recent files
  [
    "Restore Recent Closed File",
    cmdFileRestoreRecentClosedFile,
    "Ctrl+Shift+T",
  ],
  ["Open All Recent Files", cmdFileOpenAllRecentFiles],
  ["Empty Recent Files List", cmdFileEmptyRecentFileList],
];

const menuEditInsert = [
  ["Date Time (short)", cmdEditInsertDateTimeShort],
  ["Date Time (long)", cmdEditInsertDateTimeLong],
  ["Date Time (customized)", cmdEditInsertDateTimeCustomized],
];

const menuEdit = [
  ["Undo", cmdEditUndo, "Ctrl+Z"],
  ["Redo", cmdEditRedo, "Ctrl+Y"],
  menuDiv,
  ["Cut", cmdEditCut, "Ctrl+X"],
  ["Copy", cmdEditCopy, "Ctrl+C"],
  ["Paste", cmdEditPaste, "Ctrl+Y"],
  ["Delete", cmdEditDelete, "DEL"],
  ["Select All", cmdEditSelectAll, "Ctrl+A"],
  ["Begin/End Select", cmdEditBeginEditSelect],
  menuDiv,
  ["Insert", menuEditInsert],
];

export const cmdSearchFind = "cmdSearchFind";
export const cmdSearchFindInFiles = "cmdSearchFindInFiles";
export const cmdSearchFindNext = "cmdSearchFindNext";
export const cmdSearchFindPrevious = "cmdSearchFindPrevious";

const menuSearch = [
  ["Find", cmdSearchFind, "Ctrl+F"],
  ["Find in Files...", cmdSearchFindInFiles, "Ctrl+Shift+f"],
  ["Find Next", cmdSearchFindNext, "F3"],
  ["Find Previous", cmdSearchFindPrevious, "Shift+F3"],
];

const menuView = [];

export const mainMenuBar = [
  ["&File", menuFile],
  ["&Edit", menuEdit],
  ["&Search", menuSearch],
  ["&View", menuView],
];
