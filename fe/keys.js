// https://keyjs.dev/ : to see what's what

import { len } from "./util";

/**
 * @param {KeyboardEvent} ev
 * @returns {boolean}
 */
export function isEsc(ev) {
  return ev.key === "Escape";
}

/**
 * @param {KeyboardEvent} ev
 * @returns {boolean}
 */
export function isEnter(ev) {
  return ev.key === "Enter";
}

/**
 * @param {KeyboardEvent} ev
 * @returns {boolean}
 */
export function isUp(ev) {
  return ev.key == "ArrowUp" || ev.key == "Up";
}

/**
 * @param {KeyboardEvent} ev
 * @returns {boolean}
 */
export function isDown(ev) {
  return ev.key == "ArrowDown" || ev.key == "Down";
}

/**
 * navigation up is: Up or Ctrl-P
 * @param {KeyboardEvent} ev
 * @returns {boolean}
 */
export function isNavUp(ev) {
  if (isUp(ev)) {
    return true;
  }
  return ev.ctrlKey && ev.code === "KeyP";
}

/**
 * navigation down is: Down or Ctrl-N
 * @param {KeyboardEvent} ev
 * @returns {boolean}
 */
export function isNavDown(ev) {
  if (isDown(ev)) {
    return true;
  }
  return ev.ctrlKey && ev.code === "KeyN";
}

function isFuncKey(s) {
  return /F\d{1,2}/.test(s);
}
/**
 * @param {string} s
 * @returns {Object}
 */
export function parseShortcut(s) {
  // those fields match KeyboardEvent
  let res = {
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    key: "",
  };
  let parts = s.split("+");
  while (len(parts) > 1) {
    let mod = parts.shift().toLowerCase();
    if (mod === "shift") {
      if (res.shiftKey) {
        return null;
      }
      res.shiftKey = true;
    } else if (mod === "ctrl") {
      if (res.ctrlKey) {
        return null;
      }
      res.ctrlKey = true;
    } else if (mod === "alt") {
      if (res.altKey) {
        return null;
      }
      res.altKey = true;
    } else {
      return null;
    }
  }
  let key = parts[0];
  if (len(key) === 1) {
    key = key.toLowerCase();
    // let keyCode = key.charCodeAt(0);
    if (key >= "a" && key <= "z") {
      res.key = key;
      return res;
    }
    if (key >= "0" && key <= "9") {
      res.key = key;
      return res;
    }
  }
  // TODO: "Backspace"
  if (isFuncKey(key) || key === "Delete") {
    res.key = key;
    return res;
  }
  if (key === "Esc" || key === "Escape") {
    res.key = "Esc";
    return res;
  }
  return null;
}
