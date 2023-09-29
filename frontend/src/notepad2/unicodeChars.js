// based on Edit.c in notepad2

import { throwIf } from "../util";
import {
  IDM_INSERT_UNICODE_WJ,
  IDM_INSERT_UNICODE_ZWJ,
  IDM_INSERT_UNICODE_ZWNJ,
  IDM_INSERT_UNICODE_LRM,
  IDM_INSERT_UNICODE_RLM,
  IDM_INSERT_UNICODE_LRE,
  IDM_INSERT_UNICODE_RLE,
  IDM_INSERT_UNICODE_LRO,
  IDM_INSERT_UNICODE_RLO,
  IDM_INSERT_UNICODE_LRI,
  IDM_INSERT_UNICODE_RLI,
  IDM_INSERT_UNICODE_FSI,
  IDM_INSERT_UNICODE_PDI,
  IDM_INSERT_UNICODE_PDF,
  IDM_INSERT_UNICODE_NADS,
  IDM_INSERT_UNICODE_NODS,
  IDM_INSERT_UNICODE_ASS,
  IDM_INSERT_UNICODE_ISS,
  IDM_INSERT_UNICODE_AAFS,
  IDM_INSERT_UNICODE_IAFS,
  IDM_INSERT_UNICODE_ALM,
  IDM_INSERT_UNICODE_RS,
  IDM_INSERT_UNICODE_US,
  IDM_INSERT_UNICODE_LS,
  IDM_INSERT_UNICODE_PS,
  IDM_INSERT_UNICODE_ZWSP,
} from "./menu-notepad2";

export const unicodeChars = [
  ["\u200E", "LRM", IDM_INSERT_UNICODE_LRM], // 	LRM		Left-to-right mark
  ["\u200F", "RLM", IDM_INSERT_UNICODE_RLM], // 	RLM		Right-to-left mark
  ["\u200D", "ZWJ", IDM_INSERT_UNICODE_ZWJ], // 	ZWJ		Zero width joiner
  ["\u200C", "ZWNJ", IDM_INSERT_UNICODE_ZWNJ], // 	ZWNJ	Zero width non-joiner
  ["\u202A", "LRE", IDM_INSERT_UNICODE_LRE], // 	LRE		Start of left-to-right embedding
  ["\u202B", "RLE", IDM_INSERT_UNICODE_RLE], // 	RLE		Start of right-to-left embedding
  ["\u202D", "LRO", IDM_INSERT_UNICODE_LRO], // 	LRO		Start of left-to-right override
  ["\u202E", "RLO", IDM_INSERT_UNICODE_RLO], // 	RLO		Start of right-to-left override
  ["\u202C", "PDF", IDM_INSERT_UNICODE_PDF], // 	PDF		Pop directional formatting
  ["\u206E", "NADS", IDM_INSERT_UNICODE_NADS], // 	NADS	National digit shapes substitution
  ["\u206F", "NODS", IDM_INSERT_UNICODE_NODS], // 	NODS	Nominal (European) digit shapes
  ["\u206B", "ASS", IDM_INSERT_UNICODE_ASS], // 	ASS		Activate symmetric swapping
  ["\u206A", "ISS", IDM_INSERT_UNICODE_ISS], // 	ISS		Inhibit symmetric swapping
  ["\u206D", "AAFS", IDM_INSERT_UNICODE_AAFS], // 	AAFS	Activate Arabic form shaping
  ["\u206C", "IAFS", IDM_INSERT_UNICODE_IAFS], // 	IAFS	Inhibit Arabic form shaping
  // Scintilla built-in, Editor::SetRepresentations()
  ["\u001E", "", IDM_INSERT_UNICODE_RS], // 	RS		Record Separator (Block separator)
  ["\u001F", "", IDM_INSERT_UNICODE_US], // 	US		Unit Separator (Segment separator)
  ["\u2028x80", "", IDM_INSERT_UNICODE_LS], // 	LS		Line Separator
  ["\u2029x80", "", IDM_INSERT_UNICODE_PS], // 	PS		Paragraph Separator
  // Other
  ["\u200B", "ZWSP", IDM_INSERT_UNICODE_ZWSP], // 	ZWSP	Zero width space
  ["\u2060", "WJ", IDM_INSERT_UNICODE_WJ], // 	WJ		Word joiner
  ["\u2066", "LRI", IDM_INSERT_UNICODE_LRI], // 	LRI		Left-to-right isolate
  ["\u2067", "RLI", IDM_INSERT_UNICODE_RLI], // 	RLI		Right-to-left isolate
  ["\u2068", "FSI", IDM_INSERT_UNICODE_FSI], // 	FSI		First strong isolate
  ["\u2069", "PDI", IDM_INSERT_UNICODE_PDI], // 	PDI		Pop directional isolate
  ["\u061C", "ALM", IDM_INSERT_UNICODE_ALM], // 	ALM		Arabic letter mark
];

/**
 * @param {string} id
 * @returns {string}
 */
export function findUnicodeStrByMenuID(id) {
  for (let a of unicodeChars) {
    if (a[2] === id) {
      return a[0];
    }
  }
  throwIf(true, `unknown id '${id}'`);
}
