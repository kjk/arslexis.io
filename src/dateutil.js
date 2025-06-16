import { leftPad } from "./strutil";

const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];

const daysLong = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

var monthsLong = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * @returns {string}
 */
export function getCurrentDate() {
  // TODO: not sure if right, maybe use local date, not UTC
  return new Date().toISOString().split("T")[0];
}

/**
 * @returns {string}
 */
export function getCurrentDateTime() {
  // TODO: not sure if right, maybe use local date, not UTC
  return new Date().toISOString().split(".")[0].replace("T", " ");
}

/**
 * return: 6:04 PM
 * @param {Date} d
 * @returns {string}
 */
export function getTimeShort(d) {
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  const hr = d.getHours() - 12;
  const min = leftPad("" + d.getMinutes(), 2, "0");
  return hr + ":" + min + " " + ampm;
}

/**
 * 6:04 PM Tue, 2/21/2023
 * @returns {string}
 */
export function getShortDate() {
  const d = new Date();
  const ts = getTimeShort(d);
  const dayOfWeek = d.getDay();
  const dayName = daysShort[dayOfWeek];
  const dayOfMonth = d.getDate();
  const m = d.getMonth() + 1;
  const y = d.getFullYear();
  return ts + " " + dayName + ", " + m + "/" + dayOfMonth + "/" + y;
}

/**
 * 6:04 PM Tuesday, February 21, 2023
 * @returns {string}
 */
export function getLongDate() {
  const d = new Date();
  const ts = getTimeShort(d);
  const dayOfWeek = d.getDay();
  const dayName = daysLong[dayOfWeek];
  const dayOfMonth = d.getDate();
  const monthName = monthsLong[d.getMonth()];
  const y = d.getFullYear();
  return ts + " " + dayName + ", " + monthName + " " + dayOfMonth + ", " + y;
}

/**
 * @returns {string}
 */
export function getUTCDate() {
  return new Date().toISOString();
}

/**
 * @returns {string}
 */
export function getUnixTimestampSeconds() {
  return (Date.now() / 1000).toFixed();
}

const hasPerformance = performance && performance.now && performance.timeOrigin;

/**
 * @returns {string}
 */
export function getUnixTimestampMs() {
  if (hasPerformance) {
    return (performance.timeOrigin + performance.now()).toFixed();
  }
  return Date.now().toString();
}

/**
 * @returns {string}
 */
export function getUnixTimestampUs() {
  if (hasPerformance) {
    return (
      (performance.timeOrigin + window.performance.now()) *
      1000
    ).toFixed();
  }
  return (Date.now() * 1000).toString();
}
