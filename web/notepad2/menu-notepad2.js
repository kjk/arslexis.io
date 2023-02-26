// commands

const MENU_SEPARATOR = "---";

export const IDT_FILE_NEW = "IDT_FILE_NEW";
export const IDT_FILE_OPEN = "IDT_FILE_OPEN";
export const IDT_FILE_BROWSE = "IDT_FILE_BROWSE";
export const IDT_FILE_SAVE = "IDT_FILE_SAVE";
export const IDT_EDIT_UNDO = "IDT_EDIT_UNDO";
export const IDT_EDIT_REDO = "IDT_EDIT_REDO";
export const IDT_EDIT_CUT = "IDT_EDIT_CUT";
export const IDT_EDIT_COPY = "IDT_EDIT_COPY";
export const IDT_EDIT_PASTE = "IDT_EDIT_PASTE";
export const IDT_EDIT_FIND = "IDT_EDIT_FIND";
export const IDT_EDIT_REPLACE = "IDT_EDIT_REPLACE";
export const IDT_VIEW_WORDWRAP = "IDT_VIEW_WORDWRAP";
export const IDT_VIEW_ZOOMIN = "IDT_VIEW_ZOOMIN";
export const IDT_VIEW_ZOOMOUT = "IDT_VIEW_ZOOMOUT";
export const IDT_VIEW_SCHEME = "IDT_VIEW_SCHEME";
export const IDT_VIEW_SCHEMECONFIG = "IDT_VIEW_SCHEMECONFIG";
export const IDT_FILE_EXIT = "IDT_FILE_EXIT";
export const IDT_FILE_SAVEAS = "IDT_FILE_SAVEAS";
export const IDT_FILE_SAVECOPY = "IDT_FILE_SAVECOPY";
export const IDT_EDIT_DELETE = "IDT_EDIT_DELETE";
export const IDT_FILE_PRINT = "IDT_FILE_PRINT";
export const IDT_FILE_OPENFAV = "IDT_FILE_OPENFAV";
export const IDT_FILE_ADDTOFAV = "IDT_FILE_ADDTOFAV";
export const IDT_VIEW_TOGGLEFOLDS = "IDT_VIEW_TOGGLEFOLDS";
export const IDT_FILE_LAUNCH = "IDT_FILE_LAUNCH";
export const IDT_VIEW_ALWAYSONTOP = "IDT_VIEW_ALWAYSONTOP";

export const IDM_FILE_READONLY_FILE = "IDM_FILE_READONLY_FILE";
export const IDM_FILE_READONLY_MODE = "IDM_FILE_READONLY_MODE";
const menuFileMode = [
  // ["Read Only &File", IDM_FILE_READONLY_FILE],
  ["&Read Only Mode\tF10", IDM_FILE_READONLY_MODE],
];

export const CMD_RELOADUTF8 = "CMD_RELOADUTF8";
export const CMD_RELOADANSI = "CMD_RELOADANSI";
export const CMD_RELOADOEM = "CMD_RELOADOEM";
export const CMD_RECODEDEFAULT = "CMD_RECODEDEFAULT";
export const IDM_RECODE_SELECT = "IDM_RECODE_SELECT";
export const CMD_RELOADNOFILEVARS = "CMD_RELOADNOFILEVARS";

// const menuReload = [
//   ["As UTF-&8\tShift+F8", CMD_RELOADUTF8],
//   ["As &ANSI\tCtrl+Shift+A", CMD_RELOADANSI],
//   ["As &OEM\tCtrl+Shift+O", CMD_RELOADOEM],
//   menuSep,
//   ["&Default Encoding\tCtrl+Alt+F", CMD_RECODEDEFAULT],
//   ["&With Encoding...\tF8", IDM_RECODE_SELECT],
//   menuSep,
//   ["&No File Variables\tAlt+F8", CMD_RELOADNOFILEVARS],
// ];

export const IDM_ENCODING_ANSI = "IDM_ENCODING_ANSI";
export const IDM_ENCODING_UTF8 = "IDM_ENCODING_UTF8";
export const IDM_ENCODING_UTF8SIGN = "IDM_ENCODING_UTF8SIGN";
export const IDM_ENCODING_UNICODE = "IDM_ENCODING_UNICODE";
export const IDM_ENCODING_UNICODEREV = "IDM_ENCODING_UNICODEREV";
export const IDM_ENCODING_SELECT = "IDM_ENCODING_SELECT";
export const IDM_ENCODING_SETDEFAULT = "IDM_ENCODING_SETDEFAULT";

// const menuEncoding = [
//   ["&ANSI", IDM_ENCODING_ANSI],
//   ["UTF-&8", IDM_ENCODING_UTF8],
//   ["UTF-8 B&OM", IDM_ENCODING_UTF8SIGN],
//   ["UTF-16&LE BOM", IDM_ENCODING_UNICODE],
//   ["UTF-16&BE BOM", IDM_ENCODING_UNICODEREV],
//   ["&More...\tF9", IDM_ENCODING_SELECT],
//   [SEPARATOR],
//   ["&Default...", IDM_ENCODING_SETDEFAULT],
// ];

export const IDM_LINEENDINGS_CRLF = "IDM_LINEENDINGS_CRLF";
export const IDM_LINEENDINGS_LF = "IDM_LINEENDINGS_LF";
export const IDM_LINEENDINGS_CR = "IDM_LINEENDINGS_CR";
export const IDM_LINEENDINGS_SETDEFAULT = "IDM_LINEENDINGS_SETDEFAULT";

const menuLineEndings = [
  ["&Windows (CR+LF)", IDM_LINEENDINGS_CRLF],
  ["&Unix/macOS (LF)", IDM_LINEENDINGS_LF],
  ["Classic &Mac OS (CR)", IDM_LINEENDINGS_CR],
  [MENU_SEPARATOR],
  ["&Default...", IDM_LINEENDINGS_SETDEFAULT],
];

export const IDM_FILE_OPENFAV = "IDM_FILE_OPENFAV";
export const IDM_FILE_ADDTOFAV = "IDM_FILE_ADDTOFAV";
export const IDM_FILE_MANAGEFAV = "IDM_FILE_MANAGEFAV";

const menuFavorites = [
  ["&Open Favorites...\tAlt+I", IDM_FILE_OPENFAV],
  ["&Add Current File...\tAlt+K", IDM_FILE_ADDTOFAV],
  ["&Manage...\tAlt+F9", IDM_FILE_MANAGEFAV],
];

export const IDM_FILE_NEW = "IDM_FILE_NEW";
export const IDM_FILE_OPEN = "IDM_FILE_OPEN";
export const IDM_FILE_SAVE = "IDM_FILE_SAVE";
export const IDM_FILE_SAVEAS = "IDM_FILE_SAVEAS";
export const IDM_FILE_SAVEBACKUP = "IDM_FILE_SAVEBACKUP";
export const IDM_FILE_SAVECOPY = "IDM_FILE_SAVECOPY";
export const IDM_FILE_REVERT = "IDM_FILE_REVERT";
export const IDM_FILE_PAGESETUP = "IDM_FILE_PAGESETUP";
export const IDM_FILE_PRINT = "IDM_FILE_PRINT";
export const IDM_FILE_PROPERTIES = "IDM_FILE_PROPERTIES";
export const IDM_FILE_OPEN_CONTAINING_FOLDER =
  "IDM_FILE_OPEN_CONTAINING_FOLDER";
export const IDM_FILE_CREATELINK = "IDM_FILE_CREATELINK";
export const IDM_FILE_BROWSE = "IDM_FILE_BROWSE";
export const IDM_FILE_RECENT = "IDM_FILE_RECENT";
export const IDM_FILE_EXIT = "IDM_FILE_EXIT";

const menuFile = [
  ["&New\tMod+N", IDM_FILE_NEW],
  ["&Open...\tMod+O", IDM_FILE_OPEN],
  ["&Save\tMod+S", IDM_FILE_SAVE],
  ["Save &As...\tF6", IDM_FILE_SAVEAS],
  // ["Save Back&up", IDM_FILE_SAVEBACKUP],
  // ["Save Cop&y...\tMod+F6", IDM_FILE_SAVECOPY],
  MENU_SEPARATOR,
  ["File &Mode", menuFileMode],
  // ["Re&vert\tF5", IDM_FILE_REVERT],
  // ["Reloa&d", menuReload],
  MENU_SEPARATOR,
  // ["&Encoding", menuEncoding],
  ["Line Endin&gs", menuLineEndings],
  // menuSep,
  // ["Page Se&tup...", IDM_FILE_PAGESETUP],
  // ["&Print...\tCtrl+P", IDM_FILE_PRINT],
  // [SEPARATOR],
  // ["Propert&ies...", IDM_FILE_PROPERTIES],
  // ["Open &Containing Folder", IDM_FILE_OPEN_CONTAINING_FOLDER],
  // ["Create Desktop Lin&k", IDM_FILE_CREATELINK],
  [MENU_SEPARATOR],
  ["&Browse...\tCtrl+M", IDM_FILE_BROWSE],
  ["&Favorites", menuFavorites],
  ["Recent (&History)...\tAlt+H", IDM_FILE_RECENT],
  // [SEPARATOR],
  // ["E&xit\tAlt+F4", IDM_FILE_EXIT],
];

export const CMD_COPYFILENAME_NOEXT = "CMD_COPYFILENAME_NOEXT";
export const CMD_COPYFILENAME = "CMD_COPYFILENAME";
export const CMD_COPYPATHNAME = "CMD_COPYPATHNAME";
export const IDM_EDIT_COPYALL = "IDM_EDIT_COPYALL";
export const IDM_EDIT_COPYADD = "IDM_EDIT_COPYADD";
export const IDM_EDIT_COPYRTF = "IDM_EDIT_COPYRTF";
export const CMD_COPYWINPOS = "CMD_COPYWINPOS";

const menuCopyToClipboard = [
  ["&File Name", CMD_COPYFILENAME_NOEXT],
  ["File Name and &Ext.\tShift+F9", CMD_COPYFILENAME],
  // ["Full &Path Name\tAlt+Shift+F9", CMD_COPYPATHNAME],
  [MENU_SEPARATOR],
  ["Copy &All\tAlt+A", IDM_EDIT_COPYALL],
  ["Copy A&dd\tCtrl+E", IDM_EDIT_COPYADD],
  // ["Copy as &RTF", IDM_EDIT_COPYRTF],
  //MENUITEM SEPARATOR
  //MENUITEM "&Copy as Binary",					IDM_EDIT_COPY_BINARY
  //MENUITEM "Cu&t as Binary",					IDM_EDIT_CUT_BINARY
  //MENUITEM "&Paste as Binary",				IDM_EDIT_PASTE_BINARY
  // [SEPARATOR],
  // ["&Window Position\tCtrl+Shift+K", CMD_COPYWINPOS],
];

export const IDM_EDIT_SELECTIONDUPLICATE = "IDM_EDIT_SELECTIONDUPLICATE";
export const IDM_EDIT_LINECOMMENT = "IDM_EDIT_LINECOMMENT";
export const IDM_EDIT_STREAMCOMMENT = "IDM_EDIT_STREAMCOMMENT";
export const IDM_EDIT_INDENT = "IDM_EDIT_INDENT";
export const IDM_EDIT_UNINDENT = "IDM_EDIT_UNINDENT";
export const IDM_EDIT_TRIMLINES = "IDM_EDIT_TRIMLINES";
export const IDM_EDIT_STRIP1STCHAR = "IDM_EDIT_STRIP1STCHAR";
export const IDM_EDIT_STRIPLASTCHAR = "IDM_EDIT_STRIPLASTCHAR";
export const IDM_EDIT_TRIMLEAD = "IDM_EDIT_TRIMLEAD";
export const IDM_EDIT_MERGEBLANKLINES = "IDM_EDIT_MERGEBLANKLINES";
export const IDM_EDIT_REMOVEBLANKLINES = "IDM_EDIT_REMOVEBLANKLINES";
export const IDM_EDIT_MERGEDUPLICATELINE = "IDM_EDIT_MERGEDUPLICATELINE";
export const IDM_EDIT_REMOVEDUPLICATELINE = "IDM_EDIT_REMOVEDUPLICATELINE";
export const IDM_EDIT_PADWITHSPACES = "IDM_EDIT_PADWITHSPACES";
export const IDM_EDIT_COMPRESSWS = "IDM_EDIT_COMPRESSWS";

const menuSelection = [
  ["&Duplicate\tAlt+D", IDM_EDIT_SELECTIONDUPLICATE],
  [MENU_SEPARATOR],
  ["T&oggle Line Comment\tCtrl+/", IDM_EDIT_LINECOMMENT],
  ["Block &Comment\tCtrl+Q", IDM_EDIT_STREAMCOMMENT],
  ["&Indent\tTab", IDM_EDIT_INDENT],
  ["&Unindent\tShift+Tab", IDM_EDIT_UNINDENT],
  [MENU_SEPARATOR],
  ["Strip &Trailing Blanks\tAlt+T", IDM_EDIT_TRIMLINES],
  ["Strip &First Character\tAlt+Z", IDM_EDIT_STRIP1STCHAR],
  ["Strip &Last Character\tAlt+L", IDM_EDIT_STRIPLASTCHAR],
  ["Strip Leading Blan&ks", IDM_EDIT_TRIMLEAD],
  [MENU_SEPARATOR],
  ["Merge &Blank Lines\tAlt+B", IDM_EDIT_MERGEBLANKLINES],
  ["&Remove Blank Lines\tAlt+R", IDM_EDIT_REMOVEBLANKLINES],
  ["&Merge Duplicate Lines", IDM_EDIT_MERGEDUPLICATELINE],
  ["Remo&ve Duplicate Lines", IDM_EDIT_REMOVEDUPLICATELINE],
  ["&Pad With Spaces\tAlt+P", IDM_EDIT_PADWITHSPACES],
  ["Compress &Whitespace\tAlt+W", IDM_EDIT_COMPRESSWS],
];

export const IDM_EDIT_ENCLOSESELECTION = "IDM_EDIT_ENCLOSESELECTION";
export const IDM_EDIT_INSERT_XMLTAG = "IDM_EDIT_INSERT_XMLTAG";
export const CMD_ENCLOSE_TRIPLE_SQ = "CMD_ENCLOSE_TRIPLE_SQ";
export const CMD_ENCLOSE_TRIPLE_DQ = "CMD_ENCLOSE_TRIPLE_DQ";
export const CMD_ENCLOSE_TRIPLE_BT = "CMD_ENCLOSE_TRIPLE_BT";

const menuEncloseSelection = [
  ["&With...\tAlt+Q", IDM_EDIT_ENCLOSESELECTION],
  ["&HTML/XML Tag...\tAlt+X", IDM_EDIT_INSERT_XMLTAG],
  [MENU_SEPARATOR],
  ["Triple &Single Quotes\tCtrl+3", CMD_ENCLOSE_TRIPLE_SQ],
  ["Triple &Double Quotes\tCtrl+6", CMD_ENCLOSE_TRIPLE_DQ],
  ["Triple &Backticks\tCtrl+9", CMD_ENCLOSE_TRIPLE_BT],
];

export const IDM_EDIT_MOVELINEUP = "IDM_EDIT_MOVELINEUP";
export const IDM_EDIT_MOVELINEDOWN = "IDM_EDIT_MOVELINEDOWN";
export const IDM_EDIT_LINETRANSPOSE = "IDM_EDIT_LINETRANSPOSE";
export const IDM_EDIT_SORTLINES = "IDM_EDIT_SORTLINES";
export const IDM_EDIT_MODIFYLINES = "IDM_EDIT_MODIFYLINES";
export const IDM_EDIT_ALIGN = "IDM_EDIT_ALIGN";
export const IDM_EDIT_DUPLICATELINE = "IDM_EDIT_DUPLICATELINE";
export const IDM_EDIT_CUTLINE = "IDM_EDIT_CUTLINE";
export const IDM_EDIT_COPYLINE = "IDM_EDIT_COPYLINE";
export const IDM_EDIT_DELETELINE = "IDM_EDIT_DELETELINE";
export const IDM_EDIT_JOINLINES = "IDM_EDIT_JOINLINES";
export const IDM_EDIT_COLUMNWRAP = "IDM_EDIT_COLUMNWRAP";
export const IDM_EDIT_SPLITLINES = "IDM_EDIT_SPLITLINES";
export const IDM_EDIT_JOINLINESEX = "IDM_EDIT_JOINLINESEX";

const menuLines = [
  ["Move &Up\tAlt+Up", IDM_EDIT_MOVELINEUP],
  ["Mo&ve Down\tAlt+Down", IDM_EDIT_MOVELINEDOWN],
  ["T&ranspose\tAlt+S", IDM_EDIT_LINETRANSPOSE],
  [MENU_SEPARATOR],
  ["S&ort Lines...\tAlt+O", IDM_EDIT_SORTLINES],
  ["&Modify Lines...\tAlt+M", IDM_EDIT_MODIFYLINES],
  ["Alig&n Lines...\tAlt+J", IDM_EDIT_ALIGN],
  [MENU_SEPARATOR],
  ["&Duplicate Line\tCtrl+D", IDM_EDIT_DUPLICATELINE],

  // TODO: Ctrl+Shift+X,C,D seem to be intercepted by browser
  // or is it another bug in my matching?
  ["Cu&t Line", IDM_EDIT_CUTLINE],
  // ["Cu&t Line\tCtrl+Shift+X", IDM_EDIT_CUTLINE],
  ["&Copy Line", IDM_EDIT_COPYLINE],
  // ["&Copy Line\tCtrl+Shift+C", IDM_EDIT_COPYLINE],
  ["D&elete Line", IDM_EDIT_DELETELINE],
  // ["D&elete Line\tCtrl+Shift+D", IDM_EDIT_DELETELINE],

  [MENU_SEPARATOR],
  ["&Join Lines\tCtrl+J", IDM_EDIT_JOINLINES],
  ["Column &Wrap...", IDM_EDIT_COLUMNWRAP],
  ["&Split Lines\tCtrl+I", IDM_EDIT_SPLITLINES],
  ["Join &Paragraphs\tCtrl+Shift+J", IDM_EDIT_JOINLINESEX],
];
export const IDM_EDIT_CONVERTUPPERCASE = "IDM_EDIT_CONVERTUPPERCASE";
export const IDM_EDIT_CONVERTLOWERCASE = "IDM_EDIT_CONVERTLOWERCASE";
export const IDM_EDIT_INVERTCASE = "IDM_EDIT_INVERTCASE";
export const IDM_EDIT_TITLECASE = "IDM_EDIT_TITLECASE";
export const IDM_EDIT_SENTENCECASE = "IDM_EDIT_SENTENCECASE";
export const IDM_EDIT_CONVERTSPACES = "IDM_EDIT_CONVERTSPACES";
export const IDM_EDIT_CONVERTTABS = "IDM_EDIT_CONVERTTABS";
export const IDM_EDIT_CONVERTSPACES2 = "IDM_EDIT_CONVERTSPACES2";
export const IDM_EDIT_CONVERTTABS2 = "IDM_EDIT_CONVERTTABS2";
export const IDM_EDIT_NUM2HEX = "IDM_EDIT_NUM2HEX";
export const IDM_EDIT_NUM2DEC = "IDM_EDIT_NUM2DEC";
export const IDM_EDIT_NUM2BIN = "IDM_EDIT_NUM2BIN";
export const IDM_EDIT_NUM2OCT = "IDM_EDIT_NUM2OCT";

const menuConvert = [
  ["&Upper Case\tCtrl+Shift+U", IDM_EDIT_CONVERTUPPERCASE],
  ["&Lower Case\tCtrl+U", IDM_EDIT_CONVERTLOWERCASE],
  ["In&vert Case\tCtrl+Alt+U", IDM_EDIT_INVERTCASE],
  ["Title &Case\tCtrl+Alt+I", IDM_EDIT_TITLECASE],
  ["&Sentence Case\tCtrl+Alt+O", IDM_EDIT_SENTENCECASE],
  [MENU_SEPARATOR],
  ["&Tabify Selection\tCtrl+Shift+T", IDM_EDIT_CONVERTSPACES],
  ["U&ntabify Selection\tCtrl+Shift+S", IDM_EDIT_CONVERTTABS],
  ["Tabify &Indent\tCtrl+Alt+T", IDM_EDIT_CONVERTSPACES2],
  ["Untabi&fy Indent\tCtrl+Alt+S", IDM_EDIT_CONVERTTABS2],
  [MENU_SEPARATOR],
  ["To &Hexadecimal\tCtrl+Alt+H", IDM_EDIT_NUM2HEX],
  ["To &Decimal\tCtrl+Alt+D", IDM_EDIT_NUM2DEC],
  ["To &Binary\tCtrl+Alt+B", IDM_EDIT_NUM2BIN],
  ["To &Octet", IDM_EDIT_NUM2OCT],
];

export const IDM_INSERT_UNICODE_WJ = "IDM_INSERT_UNICODE_WJ";
export const IDM_INSERT_UNICODE_ZWJ = "IDM_INSERT_UNICODE_ZWJ";
export const IDM_INSERT_UNICODE_ZWNJ = "IDM_INSERT_UNICODE_ZWNJ";
export const IDM_INSERT_UNICODE_LRM = "IDM_INSERT_UNICODE_LRM";
export const IDM_INSERT_UNICODE_RLM = "IDM_INSERT_UNICODE_RLM";
export const IDM_INSERT_UNICODE_LRE = "IDM_INSERT_UNICODE_LRE";
export const IDM_INSERT_UNICODE_RLE = "IDM_INSERT_UNICODE_RLE";
export const IDM_INSERT_UNICODE_LRO = "IDM_INSERT_UNICODE_LRO";
export const IDM_INSERT_UNICODE_RLO = "IDM_INSERT_UNICODE_RLO";
export const IDM_INSERT_UNICODE_LRI = "IDM_INSERT_UNICODE_LRI";
export const IDM_INSERT_UNICODE_RLI = "IDM_INSERT_UNICODE_RLI";
export const IDM_INSERT_UNICODE_FSI = "IDM_INSERT_UNICODE_FSI";
export const IDM_INSERT_UNICODE_PDI = "IDM_INSERT_UNICODE_PDI";
export const IDM_INSERT_UNICODE_PDF = "IDM_INSERT_UNICODE_PDF";
export const IDM_INSERT_UNICODE_NADS = "IDM_INSERT_UNICODE_NADS";
export const IDM_INSERT_UNICODE_NODS = "IDM_INSERT_UNICODE_NODS";
export const IDM_INSERT_UNICODE_ASS = "IDM_INSERT_UNICODE_ASS";
export const IDM_INSERT_UNICODE_ISS = "IDM_INSERT_UNICODE_ISS";
export const IDM_INSERT_UNICODE_AAFS = "IDM_INSERT_UNICODE_AAFS";
export const IDM_INSERT_UNICODE_IAFS = "IDM_INSERT_UNICODE_IAFS";
export const IDM_INSERT_UNICODE_ALM = "IDM_INSERT_UNICODE_ALM";
export const IDM_INSERT_UNICODE_RS = "IDM_INSERT_UNICODE_RS";
export const IDM_INSERT_UNICODE_US = "IDM_INSERT_UNICODE_US";
export const IDM_INSERT_UNICODE_LS = "IDM_INSERT_UNICODE_LS";
export const IDM_INSERT_UNICODE_PS = "IDM_INSERT_UNICODE_PS";
export const IDM_INSERT_UNICODE_ZWSP = "IDM_INSERT_UNICODE_ZWSP";

const menuUnicodeControl = [
  ["WJ\t&Word joiner", IDM_INSERT_UNICODE_WJ],
  ["ZWJ\tZero width &joiner", IDM_INSERT_UNICODE_ZWJ],
  ["ZWNJ\tZero width &non-joiner", IDM_INSERT_UNICODE_ZWNJ],
  ["LRM\t&Left-to-right mark", IDM_INSERT_UNICODE_LRM],
  ["RLM\t&Right-to-left mark", IDM_INSERT_UNICODE_RLM],
  ["LRE\tStart of left-to-right &embedding", IDM_INSERT_UNICODE_LRE],
  ["RLE\tStart of right-to-left e&mbedding", IDM_INSERT_UNICODE_RLE],
  ["LRO\tStart of left-to-right &override", IDM_INSERT_UNICODE_LRO],
  ["RLO\tStart of right-to-left o&verride", IDM_INSERT_UNICODE_RLO],
  ["LRI\tLeft-to-&right isolate", IDM_INSERT_UNICODE_LRI],
  ["RLI\tRight-to-&left isolate", IDM_INSERT_UNICODE_RLI],
  ["FSI\t&First strong isolate", IDM_INSERT_UNICODE_FSI],
  ["PDI\tPo&p directional isolate", IDM_INSERT_UNICODE_PDI],
  ["PDF\t&Pop directional formatting", IDM_INSERT_UNICODE_PDF],
  ["NADS\tN&ational digit shapes substitution", IDM_INSERT_UNICODE_NADS],
  ["NODS\tNominal (European) &digit shapes", IDM_INSERT_UNICODE_NODS],
  ["ASS\tActivate &symmetric swapping", IDM_INSERT_UNICODE_ASS],
  ["ISS\tInhibit s&ymmetric swapping", IDM_INSERT_UNICODE_ISS],
  ["AAFS\tActivate Arabic &form shaping", IDM_INSERT_UNICODE_AAFS],
  ["IAFS\tInhibit Arabic form s&haping", IDM_INSERT_UNICODE_IAFS],
  ["ALM\t&Arabic letter mark", IDM_INSERT_UNICODE_ALM],
  ["RS\tRecord Separator (&Block separator)", IDM_INSERT_UNICODE_RS],
  ["US\tUnit Separator (&Segment separator)", IDM_INSERT_UNICODE_US],
  ["LS\tL&ine Separator", IDM_INSERT_UNICODE_LS],
  ["PS\tPara&graph Separator", IDM_INSERT_UNICODE_PS],
  ["ZWSP\t&Zero width space", IDM_INSERT_UNICODE_ZWSP],
];

export const IDM_EDIT_INSERT_TIMESTAMP_MS = "IDM_EDIT_INSERT_TIMESTAMP_MS";
export const IDM_EDIT_INSERT_TIMESTAMP_US = "IDM_EDIT_INSERT_TIMESTAMP_US";
export const IDM_EDIT_INSERT_TIMESTAMP_NS = "IDM_EDIT_INSERT_TIMESTAMP_NS";

const menuOtherTimestamps = [
  ["&Millisecond (ms)", IDM_EDIT_INSERT_TIMESTAMP_MS],
  ["Micro&second (us)", IDM_EDIT_INSERT_TIMESTAMP_US],
  // note: resolution not supported in browsers
  // ["&Nanosecond (ns)", IDM_EDIT_INSERT_TIMESTAMP_NS],
];

export const IDM_EDIT_COMPLETEWORD = "IDM_EDIT_COMPLETEWORD";
export const IDM_EDIT_INSERT_GUID = "IDM_EDIT_INSERT_GUID";
export const CMD_INSERTFILENAME_NOEXT = "CMD_INSERTFILENAME_NOEXT";
export const IDM_EDIT_INSERT_FILENAME = "IDM_EDIT_INSERT_FILENAME";
export const IDM_EDIT_INSERT_PATHNAME = "IDM_EDIT_INSERT_PATHNAME";
export const IDM_EDIT_INSERT_LOC_DATE = "IDM_EDIT_INSERT_LOC_DATE";
export const IDM_EDIT_INSERT_LOC_DATETIME = "IDM_EDIT_INSERT_LOC_DATETIME";
export const IDM_EDIT_INSERT_UTC_DATETIME = "IDM_EDIT_INSERT_UTC_DATETIME";
export const IDM_EDIT_INSERT_TIMESTAMP = "IDM_EDIT_INSERT_TIMESTAMP";
export const IDM_EDIT_INSERT_SHORTDATE = "IDM_EDIT_INSERT_SHORTDATE";
export const IDM_EDIT_INSERT_LONGDATE = "IDM_EDIT_INSERT_LONGDATE";
export const IDM_EDIT_INSERT_ENCODING = "IDM_EDIT_INSERT_ENCODING";
export const IDM_EDIT_INSERT_SHEBANG = "IDM_EDIT_INSERT_SHEBANG";

const menuInsert = [
  ["Complete &Word\tAlt+/", IDM_EDIT_COMPLETEWORD],
  [MENU_SEPARATOR],
  ["&HTML/XML Tag...\tAlt+X", IDM_EDIT_INSERT_XMLTAG],
  ["New &GUID", IDM_EDIT_INSERT_GUID],
  ["Unicode &Control Character", menuUnicodeControl],
  [MENU_SEPARATOR],
  ["&File Name", CMD_INSERTFILENAME_NOEXT],
  ["File Name and E&xtension\tCtrl+F9", IDM_EDIT_INSERT_FILENAME],
  // ["Full &Path Name\tCtrl+Shift+F9", IDM_EDIT_INSERT_PATHNAME],
  [MENU_SEPARATOR],
  ["Current &Date", IDM_EDIT_INSERT_LOC_DATE],
  ["Current Date &Time", IDM_EDIT_INSERT_LOC_DATETIME],
  ["&UTC Date Time", IDM_EDIT_INSERT_UTC_DATETIME],
  ["Unix Timesta&mp", IDM_EDIT_INSERT_TIMESTAMP],
  ["&Other Timestamps", menuOtherTimestamps],
  ["Time/Date (&Short Form)\tCtrl+F5", IDM_EDIT_INSERT_SHORTDATE],
  ["Time/Date (&Long Form)\tCtrl+Shift+F5", IDM_EDIT_INSERT_LONGDATE],
  [MENU_SEPARATOR],
  // ["&Encoding Identifier\tCtrl+F8", IDM_EDIT_INSERT_ENCODING],
  ["Script She&bang Line", IDM_EDIT_INSERT_SHEBANG],
];

export const IDM_EDIT_CHAR2HEX = "IDM_EDIT_CHAR2HEX";
export const IDM_EDIT_HEX2CHAR = "IDM_EDIT_HEX2CHAR";
export const IDM_EDIT_SHOW_HEX = "IDM_EDIT_SHOW_HEX";
export const IDM_EDIT_ESCAPECCHARS = "IDM_EDIT_ESCAPECCHARS";
export const IDM_EDIT_UNESCAPECCHARS = "IDM_EDIT_UNESCAPECCHARS";
export const IDM_EDIT_XHTML_ESCAPE_CHAR = "IDM_EDIT_XHTML_ESCAPE_CHAR";
export const IDM_EDIT_XHTML_UNESCAPE_CHAR = "IDM_EDIT_XHTML_UNESCAPE_CHAR";
export const IDM_EDIT_DELETELINELEFT = "IDM_EDIT_DELETELINELEFT";
export const IDM_EDIT_DELETELINERIGHT = "IDM_EDIT_DELETELINERIGHT";
export const CMD_CTRLBACK = "CMD_CTRLBACK";
export const CMD_CTRLDEL = "CMD_CTRLDEL";
export const CMD_TIMESTAMPS = "CMD_TIMESTAMPS";

const menuSpecial = [
  ["C&har to Hex\tCtrl+Alt+X", IDM_EDIT_CHAR2HEX],
  ["Hex to Cha&r\tCtrl+Alt+C", IDM_EDIT_HEX2CHAR],
  ["&Show Hex Code", IDM_EDIT_SHOW_HEX],
  [MENU_SEPARATOR],
  ["Esca&pe C Chars\tCtrl+Alt+E", IDM_EDIT_ESCAPECCHARS],
  ["&Unescape C Chars\tCtrl+Alt+R", IDM_EDIT_UNESCAPECCHARS],
  ["Escape HT&ML/XML Chars\tAlt+Shift+X", IDM_EDIT_XHTML_ESCAPE_CHAR],
  ["Unescape HTML/&XML Chars\tAlt+Shift+H", IDM_EDIT_XHTML_UNESCAPE_CHAR],
  [MENU_SEPARATOR],
  ["Delete &Line Left\tCtrl+Shift+Back", IDM_EDIT_DELETELINELEFT],
  ["Delete Li&ne Right\tCtrl+Shift+Del", IDM_EDIT_DELETELINERIGHT],
  ["Delete Word Le&ft\tCtrl+Back", CMD_CTRLBACK],
  ["Delete Word Ri&ght\tCtrl+Del", CMD_CTRLDEL],
  // [SEPARATOR],
  // ["Update &Timestamps\tShift+F5", CMD_TIMESTAMPS],
];

export const IDM_EDIT_UNDO = "IDM_EDIT_UNDO";
export const IDM_EDIT_REDO = "IDM_EDIT_REDO";
export const IDM_EDIT_CUT = "IDM_EDIT_CUT";
export const IDM_EDIT_COPY = "IDM_EDIT_COPY";
export const IDM_EDIT_PASTE = "IDM_EDIT_PASTE";
export const IDM_EDIT_DELETE = "IDM_EDIT_DELETE";
export const IDM_EDIT_SELECTALL = "IDM_EDIT_SELECTALL";
export const IDM_EDIT_SWAP = "IDM_EDIT_SWAP";
export const IDM_EDIT_CLEARDOCUMENT = "IDM_EDIT_CLEARDOCUMENT";
export const IDM_EDIT_CLEARCLIPBOARD = "IDM_EDIT_CLEARCLIPBOARD";

export const IDM_EDIT_FIND = "IDM_EDIT_FIND";
export const IDM_EDIT_SAVEFIND = "IDM_EDIT_SAVEFIND";
export const IDM_EDIT_FINDNEXT = "IDM_EDIT_FINDNEXT";
export const IDM_EDIT_FINDPREV = "IDM_EDIT_FINDPREV";
export const IDM_EDIT_REPLACE = "IDM_EDIT_REPLACE";
export const IDM_EDIT_REPLACENEXT = "IDM_EDIT_REPLACENEXT";
export const IDM_EDIT_FINDMATCHINGBRACE = "IDM_EDIT_FINDMATCHINGBRACE";
export const IDM_EDIT_SELTOMATCHINGBRACE = "IDM_EDIT_SELTOMATCHINGBRACE";
export const IDM_EDIT_SELECTWORD = "IDM_EDIT_SELECTWORD";
export const IDM_EDIT_SELECTLINE = "IDM_EDIT_SELECTLINE";
export const IDM_EDIT_SELECTLINE_BLOCK = "IDM_EDIT_SELECTLINE_BLOCK";
export const IDM_EDIT_SELTODOCSTART = "IDM_EDIT_SELTODOCSTART";
export const IDM_EDIT_SELTODOCEND = "IDM_EDIT_SELTODOCEND";
export const IDM_EDIT_SELTONEXT = "IDM_EDIT_SELTONEXT";
export const IDM_EDIT_SELTOPREV = "IDM_EDIT_SELTOPREV";

const menuFindAndReplace = [
  ["&Find...\tCtrl+F", IDM_EDIT_FIND],
  ["Sa&ve Find Text\tAlt+F3", IDM_EDIT_SAVEFIND],
  ["Find &Next\tF3", IDM_EDIT_FINDNEXT],
  ["Find &Previous\tShift+F3", IDM_EDIT_FINDPREV],
  ["R&eplace...\tCtrl+H", IDM_EDIT_REPLACE],
  ["Repl&ace Next\tF4", IDM_EDIT_REPLACENEXT],
  [MENU_SEPARATOR],
  ["Find Matching &Brace\tCtrl+B", IDM_EDIT_FINDMATCHINGBRACE],
  ["Select to Matching B&race\tCtrl+Shift+B", IDM_EDIT_SELTOMATCHINGBRACE],
  ["Select &Word\tCtrl+Alt+Space", IDM_EDIT_SELECTWORD],
  ["Select &Lines (Expand Selection)\tCtrl+Shift+Space", IDM_EDIT_SELECTLINE],
  ["Select Lines in &Current Block\tAlt+Shift+]", IDM_EDIT_SELECTLINE_BLOCK],
  [MENU_SEPARATOR],
  ["Select to Document Star&t", IDM_EDIT_SELTODOCSTART],
  ["Select to Document En&d", IDM_EDIT_SELTODOCEND],
  ["Select to Ne&xt\tCtrl+Alt+F2", IDM_EDIT_SELTONEXT],
  ["Select to Previou&s\tCtrl+Alt+Shift+F2", IDM_EDIT_SELTOPREV],
];

export const BME_EDIT_BOOKMARKTOGGLE = "BME_EDIT_BOOKMARKTOGGLE";
export const BME_EDIT_BOOKMARKNEXT = "BME_EDIT_BOOKMARKNEXT";
export const BME_EDIT_BOOKMARKPREV = "BME_EDIT_BOOKMARKPREV";
export const BME_EDIT_BOOKMARKSELECT = "BME_EDIT_BOOKMARKSELECT";
export const BME_EDIT_BOOKMARKCLEAR = "BME_EDIT_BOOKMARKCLEAR";

const menuBookmarks = [
  ["&Toggle\tCtrl+F2", BME_EDIT_BOOKMARKTOGGLE],
  [MENU_SEPARATOR],
  ["Goto &Next\tF2", BME_EDIT_BOOKMARKNEXT],
  ["Goto &Previous\tShift+F2", BME_EDIT_BOOKMARKPREV],
  [MENU_SEPARATOR],
  ["&Select All\tAlt+F6", BME_EDIT_BOOKMARKSELECT],
  ["&Clear All\tAlt+F2", BME_EDIT_BOOKMARKCLEAR],
];

export const IDM_EDIT_GOTOLINE = "IDM_EDIT_GOTOLINE";
export const IDM_EDIT_GOTO_BLOCK_END = "IDM_EDIT_GOTO_BLOCK_END";
export const IDM_EDIT_GOTO_BLOCK_START = "IDM_EDIT_GOTO_BLOCK_START";
export const IDM_EDIT_GOTO_PREVIOUS_BLOCK = "IDM_EDIT_GOTO_PREVIOUS_BLOCK";
export const IDM_EDIT_GOTO_NEXT_BLOCK = "IDM_EDIT_GOTO_NEXT_BLOCK";
export const IDM_EDIT_GOTO_PREV_SIBLING_BLOCK =
  "IDM_EDIT_GOTO_PREV_SIBLING_BLOCK";
export const IDM_EDIT_GOTO_NEXT_SIBLING_BLOCK =
  "IDM_EDIT_GOTO_NEXT_SIBLING_BLOCK";
export const CMD_JUMP2SELSTART = "CMD_JUMP2SELSTART";
export const CMD_JUMP2SELEND = "CMD_JUMP2SELEND";

const menuGoto = [
  ["&Goto Line...\tCtrl+G", IDM_EDIT_GOTOLINE],
  //MENUITEM SEPARATOR
  //MENUITEM "Navigate &Backward\tAlt+Left",	IDM_EDIT_NAVIGATE_BACKWARD
  //MENUITEM "Navigate &Forward\tAlt+Right",	IDM_EDIT_NAVIGATE_FORWARD
  [MENU_SEPARATOR],
  ["Goto Blo&ck Start\tAlt+[", IDM_EDIT_GOTO_BLOCK_START],
  ["Goto Bloc&k End\tAlt+]", IDM_EDIT_GOTO_BLOCK_END],
  ["Goto &Previous Block\tAlt+Comma (<,)", IDM_EDIT_GOTO_PREVIOUS_BLOCK],
  ["Goto &Next Block\tAlt+Period (>.)", IDM_EDIT_GOTO_NEXT_BLOCK],
  [
    "Goto P&revious Sibling Block\tCtrl+Alt+Comma (<,)",
    IDM_EDIT_GOTO_PREV_SIBLING_BLOCK,
  ],
  [
    "Goto N&ext Sibling Block\tCtrl+Alt+Period (>.)",
    IDM_EDIT_GOTO_NEXT_SIBLING_BLOCK,
  ],
  [MENU_SEPARATOR],
  ["Goto &Selection Start\tCtrl+Shift+Comma (<,)", CMD_JUMP2SELSTART],
  ["Goto Selec&tion End\tCtrl+Shift+Period (>.)", CMD_JUMP2SELEND],
];

const menuEdit = [
  ["&Undo\tCtrl+Z\tCmd+Z", IDM_EDIT_UNDO],
  ["&Redo\tCtrl+Y\tShift+Cmd+Z", IDM_EDIT_REDO],
  [MENU_SEPARATOR],
  ["Cu&t\tMod+X", IDM_EDIT_CUT],
  ["&Copy\tMod+C", IDM_EDIT_COPY],
  ["&Paste\tMod+V", IDM_EDIT_PASTE],
  ["&Delete\tDelete", IDM_EDIT_DELETE],
  ["Select &All\tMod+A", IDM_EDIT_SELECTALL],
  ["S&wap\tCtrl+K", IDM_EDIT_SWAP],
  [MENU_SEPARATOR],
  ["Clear Docu&ment", IDM_EDIT_CLEARDOCUMENT],
  ["Clear Clip&board", IDM_EDIT_CLEARCLIPBOARD],
  ["Cop&y to Clipboard", menuCopyToClipboard],
  [MENU_SEPARATOR],
  ["&Selection", menuSelection],
  ["&Enclose Selection", menuEncloseSelection],
  ["&Lines", menuLines],
  ["Con&vert", menuConvert],
  ["I&nsert", menuInsert],
  ["Spec&ial", menuSpecial],
  ["&Find and Replace", menuFindAndReplace],
  ["Boo&kmarks", menuBookmarks],
  ["&Goto", menuGoto],
];

export const IDM_VIEW_CARET_STYLE_BLOCK_OVR = "IDM_VIEW_CARET_STYLE_BLOCK_OVR";
export const IDM_VIEW_CARET_STYLE_BLOCK = "IDM_VIEW_CARET_STYLE_BLOCK";
export const IDM_VIEW_CARET_STYLE_WIDTH1 = "IDM_VIEW_CARET_STYLE_WIDTH1";
export const IDM_VIEW_CARET_STYLE_WIDTH2 = "IDM_VIEW_CARET_STYLE_WIDTH2";
export const IDM_VIEW_CARET_STYLE_WIDTH3 = "IDM_VIEW_CARET_STYLE_WIDTH3";
export const IDM_VIEW_CARET_STYLE_NOBLINK = "IDM_VIEW_CARET_STYLE_NOBLINK";
export const IDM_VIEW_CARET_STYLE_SELECTION = "IDM_VIEW_CARET_STYLE_SELECTION";

const menuCaretStyle = [
  ["Block (&OVR Mode)", IDM_VIEW_CARET_STYLE_BLOCK_OVR],
  [MENU_SEPARATOR],
  ["Block (&INS Mode)", IDM_VIEW_CARET_STYLE_BLOCK],
  ["Line Width &1", IDM_VIEW_CARET_STYLE_WIDTH1],
  ["Line Width &2", IDM_VIEW_CARET_STYLE_WIDTH2],
  ["Line Width &3", IDM_VIEW_CARET_STYLE_WIDTH3],
  [MENU_SEPARATOR],
  ["&No Blink", IDM_VIEW_CARET_STYLE_NOBLINK],
  ["Draw Block Caret in &Selection", IDM_VIEW_CARET_STYLE_SELECTION],
];

export const IDM_VIEW_HIGHLIGHTCURRENTLINE_NONE =
  "IDM_VIEW_HIGHLIGHTCURRENTLINE_NONE";
export const IDM_VIEW_HIGHLIGHTCURRENTLINE_BACK =
  "IDM_VIEW_HIGHLIGHTCURRENTLINE_BACK";
export const IDM_VIEW_HIGHLIGHTCURRENTLINE_FRAME =
  "IDM_VIEW_HIGHLIGHTCURRENTLINE_FRAME";
export const IDM_VIEW_HIGHLIGHTCURRENTLINE_SUBLINE =
  "IDM_VIEW_HIGHLIGHTCURRENTLINE_SUBLINE";

const menuHighlightCurrentLine = [
  ["&No Highlight", IDM_VIEW_HIGHLIGHTCURRENTLINE_NONE],
  ["Background &Color\tCtrl+Shift+I", IDM_VIEW_HIGHLIGHTCURRENTLINE_BACK],
  ["Outline &Frame\tCtrl+Shift+F", IDM_VIEW_HIGHLIGHTCURRENTLINE_FRAME],
  // [MENU_SEPARATOR],
  // ["Highlight &Subline", IDM_VIEW_HIGHLIGHTCURRENTLINE_SUBLINE],
];

export const IDM_VIEW_MARKOCCURRENCES_OFF = "IDM_VIEW_MARKOCCURRENCES_OFF";
export const IDM_VIEW_MARKOCCURRENCES_CASE = "IDM_VIEW_MARKOCCURRENCES_CASE";
export const IDM_VIEW_MARKOCCURRENCES_WORD = "IDM_VIEW_MARKOCCURRENCES_WORD";
export const IDM_VIEW_MARKOCCURRENCES_BOOKMARK =
  "IDM_VIEW_MARKOCCURRENCES_BOOKMARK";

const menuMarkOccurences = [
  ["&Off", IDM_VIEW_MARKOCCURRENCES_OFF],
  ["Match &Case", IDM_VIEW_MARKOCCURRENCES_CASE],
  ["Match &Whole Word Only", IDM_VIEW_MARKOCCURRENCES_WORD],
  ["Bookmark &Matched Line", IDM_VIEW_MARKOCCURRENCES_BOOKMARK],
];

export const IDM_VIEW_DEFAULT_CODE_FONT = "IDM_VIEW_DEFAULT_CODE_FONT";
export const IDM_VIEW_DEFAULT_TEXT_FONT = "IDM_VIEW_DEFAULT_TEXT_FONT";
export const IDM_VIEW_WORDWRAP = "IDM_VIEW_WORDWRAP";
export const IDM_VIEW_LONGLINEMARKER = "IDM_VIEW_LONGLINEMARKER";
export const IDM_VIEW_SHOWINDENTGUIDES = "IDM_VIEW_SHOWINDENTGUIDES";
export const IDM_VIEW_SHOWWHITESPACE = "IDM_VIEW_SHOWWHITESPACE";
export const IDM_VIEW_SHOWEOLS = "IDM_VIEW_SHOWEOLS";
export const IDM_VIEW_WORDWRAPSYMBOLS = "IDM_VIEW_WORDWRAPSYMBOLS";
export const IDM_VIEW_UNICODE_CONTROL_CHAR = "IDM_VIEW_UNICODE_CONTROL_CHAR";
export const IDM_VIEW_MATCHBRACES = "IDM_VIEW_MATCHBRACES";
export const IDM_VIEW_HIGHLIGHTCURRENT_BLOCK =
  "IDM_VIEW_HIGHLIGHTCURRENT_BLOCK";
export const IDM_VIEW_LINENUMBERS = "IDM_VIEW_LINENUMBERS";
export const IDM_VIEW_MARGIN = "IDM_VIEW_MARGIN";
export const IDM_VIEW_SHOW_FOLDING = "IDM_VIEW_SHOW_FOLDING";

export const IDM_VIEW_FOLD_DEFAULT = "IDM_VIEW_FOLD_DEFAULT";
export const IDM_VIEW_FOLD_ALL = "IDM_VIEW_FOLD_ALL";
export const IDM_VIEW_FOLD_CURRENT_BLOCK = "IDM_VIEW_FOLD_CURRENT_BLOCK";
export const IDM_VIEW_FOLD_CURRENT_LEVEL = "IDM_VIEW_FOLD_CURRENT_LEVEL";
export const IDM_VIEW_FOLD_LEVEL1 = "IDM_VIEW_FOLD_LEVEL1";
export const IDM_VIEW_FOLD_LEVEL2 = "IDM_VIEW_FOLD_LEVEL2";
export const IDM_VIEW_FOLD_LEVEL3 = "IDM_VIEW_FOLD_LEVEL3";
export const IDM_VIEW_FOLD_LEVEL4 = "IDM_VIEW_FOLD_LEVEL4";
export const IDM_VIEW_FOLD_LEVEL5 = "IDM_VIEW_FOLD_LEVEL5";
export const IDM_VIEW_FOLD_LEVEL6 = "IDM_VIEW_FOLD_LEVEL6";
export const IDM_VIEW_FOLD_LEVEL7 = "IDM_VIEW_FOLD_LEVEL7";
export const IDM_VIEW_FOLD_LEVEL8 = "IDM_VIEW_FOLD_LEVEL8";
export const IDM_VIEW_FOLD_LEVEL9 = "IDM_VIEW_FOLD_LEVEL9";
export const IDM_VIEW_FOLD_LEVEL10 = "IDM_VIEW_FOLD_LEVEL10";

export const IDM_VIEW_ZOOMIN = "IDM_VIEW_ZOOMIN";
export const IDM_VIEW_ZOOMOUT = "IDM_VIEW_ZOOMOUT";
export const IDM_VIEW_ZOOM_LEVEL = "IDM_VIEW_ZOOM_LEVEL";
export const IDM_VIEW_RESETZOOM = "IDM_VIEW_RESETZOOM";
export const IDM_VIEW_TOGGLE_FULLSCREEN = "IDM_VIEW_TOGGLE_FULLSCREEN";

const menuToggleFolds = [
  ["&Default Levels\tShift+Alt+D", IDM_VIEW_FOLD_DEFAULT],
  ["&All Levels\tShift+Alt+A", IDM_VIEW_FOLD_ALL],
  ["&Current Block\tAlt+C", IDM_VIEW_FOLD_CURRENT_BLOCK],
  ["Current &Level", IDM_VIEW_FOLD_CURRENT_LEVEL],
  // [SEPARATOR],
  // ["Level &1\tAlt+1", IDM_VIEW_FOLD_LEVEL1],
  // ["Level &2\tAlt+2", IDM_VIEW_FOLD_LEVEL2],
  // ["Level &3\tAlt+3", IDM_VIEW_FOLD_LEVEL3],
  // ["Level &4\tAlt+4", IDM_VIEW_FOLD_LEVEL4],
  // ["Level &5\tAlt+5", IDM_VIEW_FOLD_LEVEL5],
  // ["Level &6\tAlt+6", IDM_VIEW_FOLD_LEVEL6],
  // ["Level &7\tAlt+7", IDM_VIEW_FOLD_LEVEL7],
  // ["Level &8\tAlt+8", IDM_VIEW_FOLD_LEVEL8],
  // ["Level &9\tAlt+9", IDM_VIEW_FOLD_LEVEL9],
  // ["Level 1&0", IDM_VIEW_FOLD_LEVEL10],
];

// const menuZoom = [
//   ["Zoom &In\tCtrl++", IDM_VIEW_ZOOMIN],
//   ["Zoom &Out\tCtrl+-", IDM_VIEW_ZOOMOUT],
//   ["Zoom &Level...", IDM_VIEW_ZOOM_LEVEL],
//   ["&Reset Zoom\tCtrl+\\", IDM_VIEW_RESETZOOM],
// ];

const menuView = [
  ["Default &Code Font...\tAlt+F12", IDM_VIEW_DEFAULT_CODE_FONT],
  ["&Default Text Font...", IDM_VIEW_DEFAULT_TEXT_FONT],
  // ["C&aret Style", menuCaretStyle],
  [MENU_SEPARATOR],
  ["Word W&rap\tCtrl+Shift+W", IDM_VIEW_WORDWRAP],
  ["&Long Line Marker\tCtrl+Shift+L", IDM_VIEW_LONGLINEMARKER],
  ["Indentation &Guides\tCtrl+Shift+G", IDM_VIEW_SHOWINDENTGUIDES],
  [MENU_SEPARATOR],
  ["Show &Whitespace\tCtrl+Shift+8", IDM_VIEW_SHOWWHITESPACE],
  ["Show Line &Endings\tCtrl+Shift+9", IDM_VIEW_SHOWEOLS],
  ["Show Wrap S&ymbols\tCtrl+Shift+0", IDM_VIEW_WORDWRAPSYMBOLS],
  ["Un&icode Control Character", IDM_VIEW_UNICODE_CONTROL_CHAR],
  //MENUITEM "S&how CallTips",						IDM_VIEW_SHOWCALLTIPS
  [MENU_SEPARATOR],
  ["&Visual Brace Matching\tCtrl+Shift+V", IDM_VIEW_MATCHBRACES],
  // TODO: can CodeMirror do it?
  // ["Highlight Current &Block", IDM_VIEW_HIGHLIGHTCURRENT_BLOCK],
  ["Highlight C&urrent Line", menuHighlightCurrentLine],
  ["Mar&k Occurrences", menuMarkOccurences],
  [MENU_SEPARATOR],
  // TODO: needs a different shortuct
  ["Line &Numbers\tCtrl+Shift+N", IDM_VIEW_LINENUMBERS],
  ["Bookmark &Margin\tCtrl+Shift+M", IDM_VIEW_MARGIN],
  [MENU_SEPARATOR],
  ["Show Code &Folding\tCtrl+Shift+Alt+F", IDM_VIEW_SHOW_FOLDING],
  ["&Toggle Folds", menuToggleFolds],
  [MENU_SEPARATOR],
  // ["&Zoom", menuZoom],
  ["Toggle Full &Screen\tF11", IDM_VIEW_TOGGLE_FULLSCREEN],
];

export const IDM_VIEW_SCHEME = "IDM_VIEW_SCHEME";
export const IDM_VIEW_SCHEME_CONFIG = "IDM_VIEW_SCHEME_CONFIG";
export const IDM_VIEW_SCHEME_FAVORITE = "IDM_VIEW_SCHEME_FAVORITE";
export const IDM_VIEW_USE2NDGLOBALSTYLE = "IDM_VIEW_USE2NDGLOBALSTYLE";
export const IDM_VIEW_USEDEFAULT_CODESTYLE = "IDM_VIEW_USEDEFAULT_CODESTYLE";
export const IDM_VIEW_STYLE_THEME_DEFAULT = "IDM_VIEW_STYLE_THEME_DEFAULT";
export const IDM_VIEW_STYLE_THEME_DARK = "IDM_VIEW_STYLE_THEME_DARK";

export const IDM_LEXER_TEXTFILE = "IDM_LEXER_TEXTFILE";
export const IDM_LEXER_2NDTEXTFILE = "IDM_LEXER_2NDTEXTFILE";
export const IDM_LEXER_CSV = "IDM_LEXER_CSV";
export const IDM_LEXER_CSS = "IDM_LEXER_CSS";
export const IDM_LEXER_SCSS = "IDM_LEXER_SCSS";
export const IDM_LEXER_LESS = "IDM_LEXER_LESS";
export const IDM_LEXER_HSS = "IDM_LEXER_HSS";
export const IDM_LEXER_WEB = "IDM_LEXER_WEB";
export const IDM_LEXER_PHP = "IDM_LEXER_PHP";
export const IDM_LEXER_JSP = "IDM_LEXER_JSP";
export const IDM_LEXER_ASPX_CS = "IDM_LEXER_ASPX_CS";
export const IDM_LEXER_ASPX_VB = "IDM_LEXER_ASPX_VB";
export const IDM_LEXER_ASP_VBS = "IDM_LEXER_ASP_VBS";
export const IDM_LEXER_ASP_JS = "IDM_LEXER_ASP_JS";
export const IDM_LEXER_MARKDOWN_GITHUB = "IDM_LEXER_MARKDOWN_GITHUB";
export const IDM_LEXER_MARKDOWN_GITLAB = "IDM_LEXER_MARKDOWN_GITLAB";
export const IDM_LEXER_MARKDOWN_PANDOC = "IDM_LEXER_MARKDOWN_PANDOC";
export const IDM_LEXER_MATLAB = "IDM_LEXER_MATLAB";
export const IDM_LEXER_OCTAVE = "IDM_LEXER_OCTAVE";
export const IDM_LEXER_SCILAB = "IDM_LEXER_SCILAB";
export const IDM_LEXER_BASH = "IDM_LEXER_BASH";
export const IDM_LEXER_CSHELL = "IDM_LEXER_CSHELL";
export const IDM_LEXER_M4 = "IDM_LEXER_M4";
export const IDM_LEXER_XML = "IDM_LEXER_XML";
export const IDM_LEXER_XSD = "IDM_LEXER_XSD";
export const IDM_LEXER_XSLT = "IDM_LEXER_XSLT";
export const IDM_LEXER_DTD = "IDM_LEXER_DTD";
export const IDM_LEXER_ANT_BUILD = "IDM_LEXER_ANT_BUILD";
export const IDM_LEXER_MAVEN_POM = "IDM_LEXER_MAVEN_POM";
export const IDM_LEXER_MAVEN_SETTINGS = "IDM_LEXER_MAVEN_SETTINGS";
export const IDM_LEXER_IVY_MODULE = "IDM_LEXER_IVY_MODULE";
export const IDM_LEXER_IVY_SETTINGS = "IDM_LEXER_IVY_SETTINGS";
export const IDM_LEXER_PMD_RULESET = "IDM_LEXER_PMD_RULESET";
export const IDM_LEXER_CHECKSTYLE = "IDM_LEXER_CHECKSTYLE";
export const IDM_LEXER_APACHE = "IDM_LEXER_APACHE";
export const IDM_LEXER_TOMCAT = "IDM_LEXER_TOMCAT";
export const IDM_LEXER_WEB_JAVA = "IDM_LEXER_WEB_JAVA";
export const IDM_LEXER_STRUTS = "IDM_LEXER_STRUTS";
export const IDM_LEXER_HIB_CFG = "IDM_LEXER_HIB_CFG";
export const IDM_LEXER_HIB_MAP = "IDM_LEXER_HIB_MAP";
export const IDM_LEXER_SPRING_BEANS = "IDM_LEXER_SPRING_BEANS";
export const IDM_LEXER_JBOSS = "IDM_LEXER_JBOSS";
export const IDM_LEXER_PROPERTY_LIST = "IDM_LEXER_PROPERTY_LIST";
export const IDM_LEXER_ANDROID_MANIFEST = "IDM_LEXER_ANDROID_MANIFEST";
export const IDM_LEXER_ANDROID_LAYOUT = "IDM_LEXER_ANDROID_LAYOUT";

const menuStyleTheme = [
  ["&Default", IDM_VIEW_STYLE_THEME_DEFAULT],
  ["Dar&k", IDM_VIEW_STYLE_THEME_DARK],
];

const menuTextFile = [
  ["&Text File", IDM_LEXER_TEXTFILE],
  ["&2nd Text File", IDM_LEXER_2NDTEXTFILE],
];

const menuCssStyleSheet = [
  ["&CSS Style Sheet", IDM_LEXER_CSS],
  ["&SCSS Style Sheet", IDM_LEXER_SCSS],
  ["&Less Style Sheet", IDM_LEXER_LESS],
  ["&HSS Style Sheet", IDM_LEXER_HSS],
];

const menuWebSourceCode = [
  ["&Web Source Code", IDM_LEXER_WEB],
  ["&PHP Page", IDM_LEXER_PHP],
  ["&JSP Page", IDM_LEXER_JSP],
  ["ASP.NET (&C#)", IDM_LEXER_ASPX_CS],
  ["ASP.NET (&VB.NET)", IDM_LEXER_ASPX_VB],
  ["ASP (V&BScript)", IDM_LEXER_ASP_VBS],
  ["ASP (J&Script)", IDM_LEXER_ASP_JS],
];

const menuMarkdown = [
  ["Git&Hub GFM", IDM_LEXER_MARKDOWN_GITHUB],
  ["Git&Lab GLFM", IDM_LEXER_MARKDOWN_GITLAB],
  ["&Pandoc", IDM_LEXER_MARKDOWN_PANDOC],
];

const menuMath = [
  ["&MATLAB", IDM_LEXER_MATLAB],
  ["&Octave", IDM_LEXER_OCTAVE],
  ["&Scilab", IDM_LEXER_SCILAB],
];

const menuShellScript = [
  ["&Shell Script", IDM_LEXER_BASH],
  ["&C Shell", IDM_LEXER_CSHELL],
  ["&M4 Macro", IDM_LEXER_M4],
];

const menuXmlDocument = [
  ["&XML Document", IDM_LEXER_XML],
  ["XML &Schema", IDM_LEXER_XSD],
  ["XSL&T Stylesheet", IDM_LEXER_XSLT],
  ["XML &DTD", IDM_LEXER_DTD],
];

const menuXmlJava = [
  ["Ant &Build", IDM_LEXER_ANT_BUILD],
  ["Maven &POM", IDM_LEXER_MAVEN_POM],
  ["&Maven Settings", IDM_LEXER_MAVEN_SETTINGS],
  ["I&vy Module", IDM_LEXER_IVY_MODULE],
  ["&Ivy Settings", IDM_LEXER_IVY_SETTINGS],
  ["PMD &Ruleset", IDM_LEXER_PMD_RULESET],
  ["&Checkstyle", IDM_LEXER_CHECKSTYLE],
];

const menuWebConfig = [
  ["&Apache Config", IDM_LEXER_APACHE],
  ["&Tomcat Config", IDM_LEXER_TOMCAT],
  ["&Web Config", IDM_LEXER_WEB_JAVA],
  ["Str&uts Config", IDM_LEXER_STRUTS],
  ["&Hibernate Config", IDM_LEXER_HIB_CFG],
  ["Hibernate &Mapping", IDM_LEXER_HIB_MAP],
  ["Spring &Beans", IDM_LEXER_SPRING_BEANS],
  ["&JBoss Config", IDM_LEXER_JBOSS],
];

const menuXmlNet = [
  //	["&Web Config",					IDM_LEXER_WEB_NET],
  //	["&ResX Resource",				IDM_LEXER_RESX],
  //	["WPF &XAML",					IDM_LEXER_XAML],
];

const menuXmlOthers = [
  ["&Property List", IDM_LEXER_PROPERTY_LIST],
  ["Android &Manifest", IDM_LEXER_ANDROID_MANIFEST],
  ["Android &Layout", IDM_LEXER_ANDROID_LAYOUT],
  //["SV&G Document",				IDM_LEXER_SVG],
];

const menuScheme = [
  ["&Syntax Scheme...\tF12", IDM_VIEW_SCHEME],
  ["&Customize Schemes...\tCtrl+F12", IDM_VIEW_SCHEME_CONFIG],
  ["&Favorite Schemes...", IDM_VIEW_SCHEME_FAVORITE],
  [MENU_SEPARATOR],
  ["Use &2nd Global Styles\tShift+F12", IDM_VIEW_USE2NDGLOBALSTYLE],
  ["&Use Default Code Style", IDM_VIEW_USEDEFAULT_CODESTYLE],
  ["St&yle Theme", menuStyleTheme],
  [MENU_SEPARATOR],
  ["&Text File", menuTextFile],
  ["CSV File...", IDM_LEXER_CSV],
  ["CSS Style S&heet", menuCssStyleSheet],
  ["&Web Source Code", menuWebSourceCode],
  ["Mark&down", menuMarkdown],
  ["&Math", menuMath],
  ["Shell Scri&pt", menuShellScript],
  //["S&QL Dialect"],
  ["&XML Document", menuXmlDocument],
  ["XML (&Java)", menuXmlJava],
  ["Web Confi&g", menuWebConfig],
  //["XML (.&NET)"],
  ["XML (&Others)", menuXmlOthers],
];

export const IDM_VIEW_TABSASSPACES = "IDM_VIEW_TABSASSPACES";
export const IDM_VIEW_TABSETTINGS = "IDM_VIEW_TABSETTINGS";
export const IDM_VIEW_WORDWRAPSETTINGS = "IDM_VIEW_WORDWRAPSETTINGS";
export const IDM_VIEW_LONGLINESETTINGS = "IDM_VIEW_LONGLINESETTINGS";
export const IDM_VIEW_AUTOCOMPLETION_SETTINGS =
  "IDM_VIEW_AUTOCOMPLETION_SETTINGS";
export const IDM_VIEW_AUTOCOMPLETION_IGNORECASE =
  "IDM_VIEW_AUTOCOMPLETION_IGNORECASE";
export const IDM_SET_LATEX_INPUT_METHOD = "IDM_SET_LATEX_INPUT_METHOD";
export const IDM_SET_MULTIPLE_SELECTION = "IDM_SET_MULTIPLE_SELECTION";
export const IDM_SET_SELECTIONASFINDTEXT = "IDM_SET_SELECTIONASFINDTEXT";
export const IDM_SET_PASTEBUFFERASFINDTEXT = "IDM_SET_PASTEBUFFERASFINDTEXT";
export const IDM_LINE_SELECTION_MODE_NONE = "IDM_LINE_SELECTION_MODE_NONE";
export const IDM_LINE_SELECTION_MODE_VS = "IDM_LINE_SELECTION_MODE_VS";
export const IDM_LINE_SELECTION_MODE_NORMAL = "IDM_LINE_SELECTION_MODE_NORMAL";
export const IDM_VIEW_MENU = "IDM_VIEW_MENU";
export const IDM_VIEW_TOOLBAR = "IDM_VIEW_TOOLBAR";
export const IDM_VIEW_CUSTOMIZE_TOOLBAR = "IDM_VIEW_CUSTOMIZE_TOOLBAR";
export const IDM_VIEW_AUTO_SCALE_TOOLBAR = "IDM_VIEW_AUTO_SCALE_TOOLBAR";
export const IDM_VIEW_STATUSBAR = "IDM_VIEW_STATUSBAR";
export const IDM_VIEW_TRANSPARENT = "IDM_VIEW_TRANSPARENT";
export const IDM_VIEW_FULLSCREEN_ON_START = "IDM_VIEW_FULLSCREEN_ON_START";
export const IDM_VIEW_FULLSCREEN_HIDE_TITLE = "IDM_VIEW_FULLSCREEN_HIDE_TITLE";
export const IDM_VIEW_SCROLLPASTLASTLINE_NO = "IDM_VIEW_SCROLLPASTLASTLINE_NO";
export const IDM_VIEW_SCROLLPASTLASTLINE_ONE =
  "IDM_VIEW_SCROLLPASTLASTLINE_ONE";
export const IDM_VIEW_SCROLLPASTLASTLINE_HALF =
  "IDM_VIEW_SCROLLPASTLASTLINE_HALF";
export const IDM_VIEW_SCROLLPASTLASTLINE_THIRD =
  "IDM_VIEW_SCROLLPASTLASTLINE_THIRD";
export const IDM_VIEW_SCROLLPASTLASTLINE_QUARTER =
  "IDM_VIEW_SCROLLPASTLASTLINE_QUARTER";
export const IDM_LANG_USER_DEFAULT = "IDM_LANG_USER_DEFAULT";
export const IDM_LANG_GERMAN = "IDM_LANG_GERMAN";
export const IDM_LANG_ENGLISH_US = "IDM_LANG_ENGLISH_US";
export const IDM_LANG_FRENCH_FRANCE = "IDM_LANG_FRENCH_FRANCE";
export const IDM_LANG_ITALIAN = "IDM_LANG_ITALIAN";
export const IDM_LANG_PORTUGUESE_BRAZIL = "IDM_LANG_PORTUGUESE_BRAZIL";
export const IDM_LANG_JAPANESE = "IDM_LANG_JAPANESE";
export const IDM_LANG_KOREAN = "IDM_LANG_KOREAN";
export const IDM_LANG_CHINESE_TRADITIONAL = "IDM_LANG_CHINESE_TRADITIONAL";
export const IDM_LANG_CHINESE_SIMPLIFIED = "IDM_LANG_CHINESE_SIMPLIFIED";
export const IDM_SET_USE_XP_FILE_DIALOG = "IDM_SET_USE_XP_FILE_DIALOG";
export const IDM_VIEW_ALWAYSONTOP = "IDM_VIEW_ALWAYSONTOP";
export const IDM_VIEW_MINTOTRAY = "IDM_VIEW_MINTOTRAY";
export const IDM_VIEW_REUSEWINDOW = "IDM_VIEW_REUSEWINDOW";
export const IDM_VIEW_STICKY_WINDOW_POSITION =
  "IDM_VIEW_STICKY_WINDOW_POSITION";
export const IDM_VIEW_CLEARWINPOS = "IDM_VIEW_CLEARWINPOS";
export const IDM_VIEW_SHOWFILENAMEONLY = "IDM_VIEW_SHOWFILENAMEONLY";
export const IDM_VIEW_SHOWFILENAMEFIRST = "IDM_VIEW_SHOWFILENAMEFIRST";
export const IDM_VIEW_SHOWFULLPATH = "IDM_VIEW_SHOWFULLPATH";
export const IDM_VIEW_SHOWEXCERPT = "IDM_VIEW_SHOWEXCERPT";
export const IDM_VIEW_SINGLEFILEINSTANCE = "IDM_VIEW_SINGLEFILEINSTANCE";
export const IDM_VIEW_CHANGENOTIFY = "IDM_VIEW_CHANGENOTIFY";
export const IDM_SET_FILE_AUTOSAVE = "IDM_SET_FILE_AUTOSAVE";
export const IDM_VIEW_NOESCFUNC = "IDM_VIEW_NOESCFUNC";
export const IDM_VIEW_ESCMINIMIZE = "IDM_VIEW_ESCMINIMIZE";
export const IDM_VIEW_ESCEXIT = "IDM_VIEW_ESCEXIT";
export const IDM_VIEW_NOSAVERECENT = "IDM_VIEW_NOSAVERECENT";
export const IDM_VIEW_NOSAVEFINDREPL = "IDM_VIEW_NOSAVEFINDREPL";
export const IDM_SET_RENDER_TECH_GDI = "IDM_SET_RENDER_TECH_GDI";
export const IDM_SET_RENDER_TECH_D2D = "IDM_SET_RENDER_TECH_D2D";
export const IDM_SET_RENDER_TECH_D2DRETAIN = "IDM_SET_RENDER_TECH_D2DRETAIN";
export const IDM_SET_RENDER_TECH_D2DDC = "IDM_SET_RENDER_TECH_D2DDC";
export const IDM_VIEW_FONTQUALITY_DEFAULT = "IDM_VIEW_FONTQUALITY_DEFAULT";
export const IDM_VIEW_FONTQUALITY_NONE = "IDM_VIEW_FONTQUALITY_NONE";
export const IDM_VIEW_FONTQUALITY_STANDARD = "IDM_VIEW_FONTQUALITY_STANDARD";
export const IDM_VIEW_FONTQUALITY_CLEARTYPE = "IDM_VIEW_FONTQUALITY_CLEARTYPE";
export const IDM_SET_RTL_LAYOUT_EDIT = "IDM_SET_RTL_LAYOUT_EDIT";
export const IDM_SET_RTL_LAYOUT_OTHER = "IDM_SET_RTL_LAYOUT_OTHER";
export const IDM_SET_BIDIRECTIONAL_NONE = "IDM_SET_BIDIRECTIONAL_NONE";
export const IDM_SET_BIDIRECTIONAL_L2R = "IDM_SET_BIDIRECTIONAL_L2R";
export const IDM_SET_BIDIRECTIONAL_R2L = "IDM_SET_BIDIRECTIONAL_R2L";
export const IDM_SET_USE_INLINE_IME = "IDM_SET_USE_INLINE_IME";
export const IDM_SET_SYSTEM_INTEGRATION = "IDM_SET_SYSTEM_INTEGRATION";
export const CMD_OPENINIFILE = "CMD_OPENINIFILE";
export const IDM_VIEW_SAVESETTINGS = "IDM_VIEW_SAVESETTINGS";
export const IDM_VIEW_SAVESETTINGSNOW = "IDM_VIEW_SAVESETTINGSNOW";

// const menuLineSelectionMode = [
//   ["&None", IDM_LINE_SELECTION_MODE_NONE],
//   ["&Visual Studio", IDM_LINE_SELECTION_MODE_VS],
//   ["Nor&mal", IDM_LINE_SELECTION_MODE_NORMAL],
// ];

const menuSelectAndEditOptions = [
  ["Enable &Multiple Selection", IDM_SET_MULTIPLE_SELECTION],
  ["Copy &Selection as Find Text", IDM_SET_SELECTIONASFINDTEXT],
  ["Copy &Paste Buffer as Find Text", IDM_SET_PASTEBUFFERASFINDTEXT],
  // ["Line Selection &Mode", menuLineSelectionMode],
];

const menuScrollPastLastLine = [
  ["&No", IDM_VIEW_SCROLLPASTLASTLINE_NO],
  ["&One Page", IDM_VIEW_SCROLLPASTLASTLINE_ONE],
  ["&Half Page", IDM_VIEW_SCROLLPASTLASTLINE_HALF],
  ["1/&3 Page", IDM_VIEW_SCROLLPASTLASTLINE_THIRD],
  ["1/&4 Page", IDM_VIEW_SCROLLPASTLASTLINE_QUARTER],
];

// const menuFullScreenMode = [
//   ["On &Startup", IDM_VIEW_FULLSCREEN_ON_START],
//   ["Hide &Title", IDM_VIEW_FULLSCREEN_HIDE_TITLE],
// ];

const menuLanguage = [
  ["&System Language", IDM_LANG_USER_DEFAULT],
  ["Deutsch", IDM_LANG_GERMAN],
  ["English", IDM_LANG_ENGLISH_US],
  ["Français (France)", IDM_LANG_FRENCH_FRANCE],
  ["Italiano", IDM_LANG_ITALIAN],
  ["Português (Brasil)", IDM_LANG_PORTUGUESE_BRAZIL],
  ["日本語", IDM_LANG_JAPANESE],
  ["한국어", IDM_LANG_KOREAN],
  ["中文(繁體)", IDM_LANG_CHINESE_TRADITIONAL],
  ["中文(简体)", IDM_LANG_CHINESE_SIMPLIFIED],
];

const menuAppearance = [
  ["Show &Menu\tAlt+F11", IDM_VIEW_MENU],
  ["S&how Toolbar\tCtrl+F11", IDM_VIEW_TOOLBAR],
  // ["Customi&ze Toolbar...", IDM_VIEW_CUSTOMIZE_TOOLBAR],
  // ["&Auto Scale Toolbar", IDM_VIEW_AUTO_SCALE_TOOLBAR],
  ["Show Stat&usbar\tShift+F11", IDM_VIEW_STATUSBAR],
  [MENU_SEPARATOR],
  // ["&Transparent Mode\tCtrl+0", IDM_VIEW_TRANSPARENT],
  // ["Full Scree&n Mode", menuFullScreenMode],
  ["Scroll &Past Last Line", menuScrollPastLastLine],
  // #if NP2_ENABLE_APP_LOCALIZATION_DLL
  //  [SEPARATOR],
  //  ["&Language", menuLanguage],
  // #endif
  // ["Use &XP Style Open/Save Dialog", IDM_SET_USE_XP_FILE_DIALOG],
];

// const menuWindowOptions = [
//   ["Always On &Top\tAlt+Shift+T", IDM_VIEW_ALWAYSONTOP],
//   ["Minimi&ze to Tray", IDM_VIEW_MINTOTRAY],
//   [SEPARATOR],
//   ["&Reuse Window", IDM_VIEW_REUSEWINDOW],
//   ["&Sticky Window Position", IDM_VIEW_STICKY_WINDOW_POSITION],
//   ["Clear Position &History", IDM_VIEW_CLEARWINPOS],
// ];

const menuWindowTitleDisplay = [
  ["&File Name Only", IDM_VIEW_SHOWFILENAMEONLY],
  // TODO:
  // ["File Name and &Directory", IDM_VIEW_SHOWFILENAMEFIRST],
  // ["Full &Path Name", IDM_VIEW_SHOWFULLPATH],
  ["&Text Excerpt", IDM_VIEW_SHOWEXCERPT],
];

// const menuExtraEscKeyFunction = [
//   ["&None", IDM_VIEW_NOESCFUNC],
//   ["&Minimize Notepad2", IDM_VIEW_ESCMINIMIZE],
//   ["E&xit Notepad2", IDM_VIEW_ESCEXIT],
// ];

const menuOtherSettings = [
  ["Remember Recent &Files", IDM_VIEW_NOSAVERECENT],
  ["Remember &Search Options", IDM_VIEW_NOSAVEFINDREPL],
];

// const menuRenderingTechnology = [
//   ["&Legacy GDI", IDM_SET_RENDER_TECH_GDI],
//   ["&Direct2D", IDM_SET_RENDER_TECH_D2D],
//   ["Direct2D &Retain", IDM_SET_RENDER_TECH_D2DRETAIN],
//   ["Direct2D &GDI DC", IDM_SET_RENDER_TECH_D2DDC],
// ];

// const menuFontQuality = [
//   ["&Default", IDM_VIEW_FONTQUALITY_DEFAULT],
//   ["&None", IDM_VIEW_FONTQUALITY_NONE],
//   ["&Standard", IDM_VIEW_FONTQUALITY_STANDARD],
//   ["&ClearType", IDM_VIEW_FONTQUALITY_CLEARTYPE],
// ];

// const menuRtlLayoutGdi = [
//   ["&Edit Window", IDM_SET_RTL_LAYOUT_EDIT],
//   ["&Other Window", IDM_SET_RTL_LAYOUT_OTHER],
// ];

// const menuBiDirectionalD2D = [
//   ["&None", IDM_SET_BIDIRECTIONAL_NONE],
//   ["&Left to Right", IDM_SET_BIDIRECTIONAL_L2R],
//   ["&Right to Left", IDM_SET_BIDIRECTIONAL_R2L],
// ];

// const menuAdvancedSettings = [
//   ["Ren&dering Technology", menuRenderingTechnology],
//   ["Font &Quality", menuFontQuality],
//   ["&RTL Layout (GDI)", menuRtlLayoutGdi],
//   ["&Bidirectional (Direct2D)", menuBiDirectionalD2D],
//   ["Use &Inline Mode IME", IDM_SET_USE_INLINE_IME],
//   [SEPARATOR],
//   ["&System Integration...", IDM_SET_SYSTEM_INTEGRATION],
//   ["&Open Notepad2.ini\tCtrl+F7", CMD_OPENINIFILE],
// ];

const menuSettings = [
  ["Insert Tabs as &Spaces", IDM_VIEW_TABSASSPACES],
  ["&Tab Settings...\tCtrl+T", IDM_VIEW_TABSETTINGS],
  ["Word &Wrap Settings...", IDM_VIEW_WORDWRAPSETTINGS],
  ["&Long Line Settings...", IDM_VIEW_LONGLINESETTINGS],
  ["&Auto Completion Settings...", IDM_VIEW_AUTOCOMPLETION_SETTINGS],
  ["Auto Completion I&gnore Case", IDM_VIEW_AUTOCOMPLETION_IGNORECASE],
  // ["Enable LaTe&X Input Method", IDM_SET_LATEX_INPUT_METHOD],
  ["Select and &Edit Options", menuSelectAndEditOptions],
  [MENU_SEPARATOR],
  ["Appea&rance", menuAppearance],
  // ["Window O&ptions", menuWindowOptions],
  ["Window Title Displa&y", menuWindowTitleDisplay],
  [MENU_SEPARATOR],
  // ["Single &File Instance", IDM_VIEW_SINGLEFILEINSTANCE],
  // ["File &Change Notification...\tAlt+F5", IDM_VIEW_CHANGENOTIFY],
  // ["A&utoSave Settings...", IDM_SET_FILE_AUTOSAVE],
  // ["Extra Esc &Key Function", menuExtraEscKeyFunction],
  ["Other Sett&ings", menuOtherSettings],
  // [SEPARATOR],
  // TODO: open .ini settings from menuAdvancedSettings
  // ["A&dvanced Settings", menuAdvancedSettings],
  // ["Save Settings &On Exit", IDM_VIEW_SAVESETTINGS],
  // ["Sa&ve Settings Now\tF7", IDM_VIEW_SAVESETTINGSNOW],
];

export const IDM_VIEW_SAVEBEFORERUNNINGTOOLS =
  "IDM_VIEW_SAVEBEFORERUNNINGTOOLS";
export const IDM_SET_OPEN_FOLDER_METAPATH = "IDM_SET_OPEN_FOLDER_METAPATH";
export const IDM_FILE_RELAUNCH_ELEVATED = "IDM_FILE_RELAUNCH_ELEVATED";
export const IDM_FILE_RESTART = "IDM_FILE_RESTART";
export const IDM_FILE_NEWWINDOW = "IDM_FILE_NEWWINDOW";
export const IDM_FILE_NEWWINDOW2 = "IDM_FILE_NEWWINDOW2";
export const IDM_FILE_LAUNCH = "IDM_FILE_LAUNCH";
export const IDM_FILE_OPENWITH = "IDM_FILE_OPENWITH";
export const IDM_FILE_RUN = "IDM_FILE_RUN";
export const CMD_OPEN_PATH_OR_LINK = "CMD_OPEN_PATH_OR_LINK";
export const CMD_OPEN_CONTAINING_FOLDER = "CMD_OPEN_CONTAINING_FOLDER";
export const CMD_ONLINE_SEARCH_GOOGLE = "CMD_ONLINE_SEARCH_GOOGLE";
export const CMD_ONLINE_SEARCH_BING = "CMD_ONLINE_SEARCH_BING";
export const CMD_ONLINE_SEARCH_WIKI = "CMD_ONLINE_SEARCH_WIKI";
export const CMD_CUSTOM_ACTION1 = "CMD_CUSTOM_ACTION1";
export const CMD_CUSTOM_ACTION2 = "CMD_CUSTOM_ACTION2";
export const IDM_EDIT_BASE64_ENCODE = "IDM_EDIT_BASE64_ENCODE";
export const IDM_EDIT_BASE64_SAFE_ENCODE = "IDM_EDIT_BASE64_SAFE_ENCODE";
export const IDM_EDIT_BASE64_HTML_EMBEDDED_IMAGE =
  "IDM_EDIT_BASE64_HTML_EMBEDDED_IMAGE";
export const IDM_EDIT_BASE64_DECODE = "IDM_EDIT_BASE64_DECODE";
export const IDM_EDIT_BASE64_DECODE_AS_HEX = "IDM_EDIT_BASE64_DECODE_AS_HEX";
export const IDM_EDIT_MAP_FULLWIDTH = "IDM_EDIT_MAP_FULLWIDTH";
export const IDM_EDIT_MAP_HALFWIDTH = "IDM_EDIT_MAP_HALFWIDTH";
export const IDM_EDIT_MAP_SIMPLIFIED_CHINESE =
  "IDM_EDIT_MAP_SIMPLIFIED_CHINESE";
export const IDM_EDIT_MAP_TRADITIONAL_CHINESE =
  "IDM_EDIT_MAP_TRADITIONAL_CHINESE";
export const IDM_EDIT_MAP_HIRAGANA = "IDM_EDIT_MAP_HIRAGANA";
export const IDM_EDIT_MAP_KATAKANA = "IDM_EDIT_MAP_KATAKANA";
export const IDM_EDIT_MAP_HANJA_HANGUL = "IDM_EDIT_MAP_HANJA_HANGUL";
export const IDM_EDIT_MAP_HANGUL_DECOMPOSITION =
  "IDM_EDIT_MAP_HANGUL_DECOMPOSITION";
export const IDM_EDIT_MAP_BENGALI_LATIN = "IDM_EDIT_MAP_BENGALI_LATIN";
export const IDM_EDIT_MAP_CYRILLIC_LATIN = "IDM_EDIT_MAP_CYRILLIC_LATIN";
export const IDM_EDIT_MAP_DEVANAGARI_LATIN = "IDM_EDIT_MAP_DEVANAGARI_LATIN";
export const IDM_EDIT_MAP_MALAYALAM_LATIN = "IDM_EDIT_MAP_MALAYALAM_LATIN";
export const IDM_EDIT_URLENCODE = "IDM_EDIT_URLENCODE";
export const IDM_EDIT_URLDECODE = "IDM_EDIT_URLDECODE";

const menuActionOnSelection = [
  // TODO: chage to "&Open Link, etc."
  ["&Open File, Folder, Link, etc.", CMD_OPEN_PATH_OR_LINK],
  // ["Open Containing &Folder", CMD_OPEN_CONTAINING_FOLDER],
  [MENU_SEPARATOR],
  ["Search with &Google", CMD_ONLINE_SEARCH_GOOGLE],
  ["Search with &Bing", CMD_ONLINE_SEARCH_BING],
  ["Search on &Wikipedia", CMD_ONLINE_SEARCH_WIKI],
  [MENU_SEPARATOR],
  ["Custom Action &1\tCtrl+Shift+1", CMD_CUSTOM_ACTION1],
  ["Custom Action &2\tCtrl+Shift+2", CMD_CUSTOM_ACTION2],
];

const menuBase64 = [
  ["Standard &Encode", IDM_EDIT_BASE64_ENCODE],
  ["URL &Safe Encode", IDM_EDIT_BASE64_SAFE_ENCODE],
  ["Encode as HTML Embedded &Image", IDM_EDIT_BASE64_HTML_EMBEDDED_IMAGE],
  ["&Decode", IDM_EDIT_BASE64_DECODE],
  ["Decode as &Hex", IDM_EDIT_BASE64_DECODE_AS_HEX],
];

// const menuTextTransliteration = [
//   ["Halfwidth Form to Full&width", IDM_EDIT_MAP_FULLWIDTH],
//   ["Fullwidth Form to H&alfwidth", IDM_EDIT_MAP_HALFWIDTH],
//   [SEPARATOR],
//   ["Chinese Traditional to &Simplified", IDM_EDIT_MAP_SIMPLIFIED_CHINESE],
//   ["Chinese Simplified to &Traditional", IDM_EDIT_MAP_TRADITIONAL_CHINESE],
//   [SEPARATOR],
//   ["Japanese Katakana to &Hiragana", IDM_EDIT_MAP_HIRAGANA],
//   ["Japanese Hiragana to &Katakana", IDM_EDIT_MAP_KATAKANA],
//   [SEPARATOR],
//   ["Korean Han&ja to Hangul", IDM_EDIT_MAP_HANJA_HANGUL],
//   ["Korean Han&gul Decomposition", IDM_EDIT_MAP_HANGUL_DECOMPOSITION],
//   [SEPARATOR],
//   ["&Bengali to Latin", IDM_EDIT_MAP_BENGALI_LATIN],
//   ["C&yrillic to Latin", IDM_EDIT_MAP_CYRILLIC_LATIN],
//   ["&Devanagari to Latin", IDM_EDIT_MAP_DEVANAGARI_LATIN],
//   ["&Malayalam to Latin", IDM_EDIT_MAP_MALAYALAM_LATIN],
// ];

const menuTools = [
  // ["Sa&ve Before Running Tools", IDM_VIEW_SAVEBEFORERUNNINGTOOLS],
  // ["Use &metapath to Open Folder", IDM_SET_OPEN_FOLDER_METAPATH],
  // [SEPARATOR],
  // ["Run as &Administrator", IDM_FILE_RELAUNCH_ELEVATED],
  // ["&Restart", IDM_FILE_RESTART],
  ["Launch &New Window\tAlt+N", IDM_FILE_NEWWINDOW],
  ["Launch &Empty Window\tAlt+0", IDM_FILE_NEWWINDOW2],
  [MENU_SEPARATOR],
  // ["Execute &Document\tCtrl+L", IDM_FILE_LAUNCH],
  // ["Open Document &With...", IDM_FILE_OPENWITH],
  // ["Run &Command...\tCtrl+R", IDM_FILE_RUN],
  // [SEPARATOR],
  ["Action &on Selection", menuActionOnSelection],
  ["&Base64", menuBase64],
  // TODO: those require windows-only .dll, maybe reverse engineer
  // or find in wine?
  // ["Text &Transliteration", menuTextTransliteration],
  ["&URL Encode\tCtrl+Shift+E", IDM_EDIT_URLENCODE],
  ["UR&L Decode\tCtrl+Shift+R", IDM_EDIT_URLDECODE],
];

export const IDM_HELP_PROJECT_HOME = "IDM_HELP_PROJECT_HOME";
export const IDM_HELP_LATEST_RELEASE = "IDM_HELP_LATEST_RELEASE";
export const IDM_HELP_LATEST_BUILD = "IDM_HELP_LATEST_BUILD";
export const IDM_HELP_REPORT_ISSUE = "IDM_HELP_REPORT_ISSUE";
export const IDM_HELP_FEATURE_REQUEST = "IDM_HELP_FEATURE_REQUEST";
export const IDM_HELP_ONLINE_WIKI = "IDM_HELP_ONLINE_WIKI";
export const IDM_CMDLINE_HELP = "IDM_CMDLINE_HELP";
export const IDM_HELP_ABOUT = "IDM_HELP_ABOUT";

const menuHelp = [
  ["Project &Home", IDM_HELP_PROJECT_HOME],
  // ["Latest &Release", IDM_HELP_LATEST_RELEASE],
  // ["Latest &Build", IDM_HELP_LATEST_BUILD],
  ["Report &Issue", IDM_HELP_REPORT_ISSUE],
  ["&Feature Request", IDM_HELP_FEATURE_REQUEST],
  // [SEPARATOR],
  // ["Online &Wiki", IDM_HELP_ONLINE_WIKI],
  // ["&Command Line Help", IDM_CMDLINE_HELP],
  [MENU_SEPARATOR],
  ["&About Notepad2\tF1", IDM_HELP_ABOUT],
];

export const mainMenuBar = [
  ["&File", menuFile],
  ["&Edit", menuEdit],
  ["&View", menuView],
  ["Sche&me", menuScheme],
  ["&Settings", menuSettings],
  ["&Tools", menuTools],
  ["&Help", menuHelp],
];

export const IDM_DUMP_SELECTIONS = "IDM_DUMP_SELECTIONS";

export const noMenuCommands = [["Dump Selections\tAlt-Y", IDM_DUMP_SELECTIONS]];
