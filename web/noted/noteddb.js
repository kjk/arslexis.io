import { genRandomID, len, sha1 } from "../util";

import { KV } from "../dbutil";

const db = new KV("noted", "keyval");

export class Note {
  // notes can have the same title so we need a unique id
  noteId = "";
  title = "";
  type = "md";
  dailyNote = false;
  immutableTitle = false;
  /** @type [string][] */ // array of sha1
  versions = [];

  constructor(title) {
    this.noteId = genRandomID(8);
    this.title = title;
  }
}

const keyPrefixContent = "content:"; // + sha1(content)
const keyNotes = "notes";

/**
 * @returns {Promise<Note[]>}
 */
export async function getNotes() {
  let res = (await db.get(keyNotes)) || [];
  console.log("getNotes:", res);
  return res;
}

/**
 * @param {Note[]} notes
 */
export async function setNotes(notes) {
  console.log("setNotes:", notes);
  await db.set(keyNotes, notes);
}

export async function addNoteVersion(note, content) {
  console.log("addNoteVersion:", note, len(content));
  let hash = await sha1(content);
  let key = keyPrefixContent + hash;
  try {
    await db.add(key, content);
  } catch (e) {
    console.log(e);
  }
  note.versions.push(hash);
}

export function setNoteTitle(note, title) {
  console.log(`setNoteTitle: curr: '${note.title}', new: '${title}'`);
  if (note.title === title) {
    return;
  }
  note.title = title;
}

/**
 * @param {Note} note
 * @returns {Promise<string>}
 */
export async function getNoteCurrentVersion(note) {
  console.log("getNoteCurrentVersion:", note);
  let n = len(note.versions);
  if (n === 0) {
    return "";
  }
  let hash = note.versions[n - 1];
  let key = keyPrefixContent + hash;
  /** @type {string} */
  let content = await db.get(key);
  return content;
}

// /** @type {import("svelte/store").Writable<Note[]>} */
// export let notes = makeIndexedDBStore(db, "notes", [], false, true);

// export async function addNoteVersion(note, content) {
//   console.log("addNoteVersion:", note, len(content));
//   let hash = sha1(content);
//   let key = keyPrefixContent + hash;
//   await db.add(key, content);
//   note.versions.push(hash);
//   resaveStore(notes);
// }

// export function setNoteTitle(note, title) {
//   console.log(`setNoteTitle: curr: '${note.title}', new: '${title}'`);
//   if (note.title === title) {
//     return;
//   }
//   note.title = title;
//   resaveStore(notes);
// }

// /**
//  * @param {Note} note
//  * @returns {Promise<string>}
//  */
// export async function getNoteCurrentVersion(note) {
//   console.log("getNoteCurrentVersion:", note);
//   let n = len(note.versions);
//   if (n === 0) {
//     return "";
//   }
//   let hash = note.versions[n - 1];
//   let key = keyPrefixContent + hash;
//   /** @type {string} */
//   let content = await db.get(key);
//   return content;
// }
